import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  CameraPrompt,
  type CameraPromptState
} from './components/CameraPrompt';
import { ControlBar, type InputSourceMode } from './components/ControlBar';
import { SpeechCloud } from './components/SpeechCloud';
import type { NameLanguage, StructureType, UILanguage } from './data/anatomyData';
import { getUIText } from './i18n/uiText';
import {
  findStructureAtPoint,
  selectFocusedStructure,
  type FocusCircle,
  type FocusSelectionResult
} from './render/focusSelector';
import { renderAnatomyFrame, type DrawableMedia } from './render/xrayRenderer';
import {
  DEV_SAMPLES,
  getDevSampleLandmarks,
  type DevSampleId
} from './vision/devFixtures';
import { LandmarkSmoother } from './vision/oneEuroFilter';
import { OrientationDetector } from './vision/orientationDetector';
import { PoseEngine, type PoseModelTier } from './vision/poseEngine';
import {
  buildSegmentRig,
  computeFrameViewport,
  projectStructuresToScreen,
  type RenderedStructureInstance,
  type ScreenPoint
} from './vision/segmentRig';
import type {
  DetectedOrientation,
  PoseLandmark,
  ViewModeOverride
} from './vision/types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getDefaultCircle(vw: number, vh: number): FocusCircle {
  return {
    cx: vw * 0.5,
    cy: vh * 0.44,
    radius: clamp(Math.min(vw, vh) * 0.25, 76, 195)
  };
}

function parseInitialParams(): {
  devSample: DevSampleId | null;
  layer: StructureType;
  nameLang: NameLanguage;
  uiLang: UILanguage;
} {
  const params = new URLSearchParams(window.location.search);
  const devParam = params.get('devInput');
  const validDev: DevSampleId | null =
    devParam === 'anterior' ||
    devParam === 'posterior' ||
    devParam === 'upper_body' ||
    devParam === 'motion_loop'
      ? devParam
      : null;

  const layerParam = params.get('layer');
  const layer: StructureType = layerParam === 'bone' ? 'bone' : 'muscle';

  const langParam = params.get('lang');
  const nameLang: NameLanguage =
    langParam === 'de' || langParam === 'en' || langParam === 'la'
      ? langParam
      : 'en';
  const uiLang: UILanguage =
    nameLang === 'de'
      ? 'de'
      : navigator.language.toLowerCase().startsWith('de') && langParam !== 'en'
        ? 'de'
        : 'en';

  return { devSample: validDev, layer, nameLang, uiLang };
}

export function App() {
  const initial = parseInitialParams();

  const [promptState, setPromptState] = useState<CameraPromptState>(
    initial.devSample ? 'dev_mode' : 'needs_consent'
  );
  const [inputMode, setInputMode] = useState<InputSourceMode>(
    initial.devSample ? 'dev_sample' : 'camera'
  );
  const [activeDevSample, setActiveDevSample] = useState<DevSampleId>(
    initial.devSample ?? 'anterior'
  );
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment'
  );
  const [canFlipCamera, setCanFlipCamera] = useState(false);

  const [layer, setLayer] = useState<StructureType>(initial.layer);
  const [nameLang, setNameLang] = useState<NameLanguage>(initial.nameLang);
  const [uiLang, setUiLang] = useState<UILanguage>(initial.uiLang);
  const [viewOverride, setViewOverride] = useState<ViewModeOverride>('auto');
  const [detectedOrientation, setDetectedOrientation] =
    useState<DetectedOrientation>('front');
  const [isFrozen, setIsFrozen] = useState(false);
  const [modelTier, setModelTier] = useState<PoseModelTier>('full');
  const [fps, setFps] = useState(0);
  const [hasPerson, setHasPerson] = useState(false);
  const [pinnedInstanceId, setPinnedInstanceId] = useState<string | null>(null);
  const [selection, setSelection] = useState<FocusSelectionResult>({
    active: null,
    isPinned: false,
    overlapping: []
  });
  const [dockPosition, setDockPosition] = useState<'top' | 'bottom'>('bottom');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cloudRef = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const uploadedImgRef = useRef<HTMLImageElement | null>(null);
  const uploadedIsVideoRef = useRef(false);
  const sampleImgRef = useRef<HTMLImageElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frozenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frozenLandmarksRef = useRef<PoseLandmark[] | null>(null);
  const lastRawLandmarksRef = useRef<PoseLandmark[] | null>(null);
  const lastMediaRef = useRef<DrawableMedia | null>(null);
  const lastInstancesRef = useRef<RenderedStructureInstance[]>([]);

  const poseEngineRef = useRef<PoseEngine>(new PoseEngine());
  const smootherRef = useRef<LandmarkSmoother>(new LandmarkSmoother(33, 1.15, 0.045));
  const orientationRef = useRef<OrientationDetector>(new OrientationDetector());

  const circleRef = useRef<FocusCircle>(
    getDefaultCircle(window.innerWidth || 390, window.innerHeight || 844)
  );
  const activePointersRef = useRef<
    Map<number, { x: number; y: number }>
  >(new Map());
  const dragStateRef = useRef<{
    mode: 'move' | 'resize' | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
    pinchStartDist: number;
    pinchStartRadius: number;
  }>({
    mode: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    pinchStartDist: 0,
    pinchStartRadius: 120
  });
  const lastTapTimeRef = useRef(0);

  // Refs synced with React state for zero-allocation RAF loop
  const stateRef = useRef({
    promptState,
    inputMode,
    activeDevSample,
    facingMode,
    layer,
    viewOverride,
    isFrozen,
    pinnedInstanceId,
    modelTier
  });
  stateRef.current = {
    promptState,
    inputMode,
    activeDevSample,
    facingMode,
    layer,
    viewOverride,
    isFrozen,
    pinnedInstanceId,
    modelTier
  };

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (facing: 'user' | 'environment') => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPromptState('missing');
        return;
      }
      setPromptState('requesting');
      stopCameraStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices.filter((d) => d.kind === 'videoinput');
          setCanFlipCamera(cams.length > 1);
        } catch {
          setCanFlipCamera(false);
        }

        smootherRef.current.reset();
        orientationRef.current.reset('front');
        setInputMode('camera');
        setPromptState('ready');
        setIsFrozen(false);
        void poseEngineRef.current.init(stateRef.current.modelTier, 'VIDEO');
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setPromptState('denied');
        } else {
          setPromptState('missing');
        }
      }
    },
    [stopCameraStream]
  );

  // Load Dev Sample image whenever activeDevSample changes
  useEffect(() => {
    if (inputMode !== 'dev_sample') return;
    const meta = DEV_SAMPLES.find((s) => s.id === activeDevSample);
    smootherRef.current.reset();
    orientationRef.current.reset(
      activeDevSample === 'posterior' ? 'back' : 'front'
    );
    setPinnedInstanceId(null);
    setIsFrozen(false);

    if (meta?.imageUrl) {
      const img = new Image();
      img.src = meta.imageUrl;
      img.onload = () => {
        sampleImgRef.current = img;
      };
    } else {
      sampleImgRef.current = null;
    }
  }, [inputMode, activeDevSample]);

  // Initialize PoseEngine when entering dev_mode directly
  useEffect(() => {
    if (promptState === 'dev_mode') {
      void poseEngineRef.current.init(
        modelTier,
        activeDevSample === 'motion_loop' ? 'VIDEO' : 'IMAGE'
      );
    }
    return () => {
      stopCameraStream();
      poseEngineRef.current.dispose();
    };
  }, []);

  const handleSelectDevSample = useCallback(
    (id: DevSampleId) => {
      stopCameraStream();
      setActiveDevSample(id);
      setInputMode('dev_sample');
      setPromptState('dev_mode');
      setIsFrozen(false);
      setPinnedInstanceId(null);
    },
    [stopCameraStream]
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      stopCameraStream();
      if (uploadedUrlRef.current) {
        URL.revokeObjectURL(uploadedUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      uploadedUrlRef.current = url;
      smootherRef.current.reset();
      orientationRef.current.reset('front');
      setPinnedInstanceId(null);
      setIsFrozen(false);

      if (file.type.startsWith('video/')) {
        uploadedIsVideoRef.current = true;
        uploadedImgRef.current = null;
        if (videoRef.current) {
          videoRef.current.src = url;
          videoRef.current.loop = true;
          videoRef.current.muted = true;
          void videoRef.current.play();
        }
        void poseEngineRef.current.ensureMode('VIDEO');
      } else {
        uploadedIsVideoRef.current = false;
        const img = new Image();
        img.src = url;
        img.onload = () => {
          uploadedImgRef.current = img;
        };
        void poseEngineRef.current.ensureMode('IMAGE');
      }
      setInputMode('uploaded_file');
      setPromptState('dev_mode');
    },
    [stopCameraStream]
  );

  const handleToggleFreeze = useCallback(() => {
    setIsFrozen((prev) => {
      const next = !prev;
      if (next) {
        const media = lastMediaRef.current;
        if (media) {
          const w =
            media instanceof HTMLVideoElement
              ? media.videoWidth
              : media.width;
          const h =
            media instanceof HTMLVideoElement
              ? media.videoHeight
              : media.height;
          if (w > 0 && h > 0) {
            if (!frozenCanvasRef.current) {
              frozenCanvasRef.current = document.createElement('canvas');
            }
            frozenCanvasRef.current.width = w;
            frozenCanvasRef.current.height = h;
            const fctx = frozenCanvasRef.current.getContext('2d');
            fctx?.drawImage(media, 0, 0, w, h);
          }
        }
        frozenLandmarksRef.current = lastRawLandmarksRef.current
          ? lastRawLandmarksRef.current.map((l) => ({ ...l }))
          : null;
      } else {
        frozenLandmarksRef.current = null;
      }
      return next;
    });
  }, []);

  const handleCycleLanguage = useCallback(() => {
    setNameLang((prev) => {
      const next: NameLanguage =
        prev === 'en' ? 'de' : prev === 'de' ? 'la' : 'en';
      if (next === 'de' || next === 'en') {
        setUiLang(next);
      }
      return next;
    });
  }, []);

  const handleCycleViewOverride = useCallback(() => {
    setViewOverride((prev) =>
      prev === 'auto' ? 'front' : prev === 'front' ? 'back' : 'auto'
    );
  }, []);

  const handleFlipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (inputMode === 'camera') {
      void startCamera(next);
    }
  }, [facingMode, inputMode, startCamera]);

  const handleChangeModelTier = useCallback((tier: PoseModelTier) => {
    setModelTier(tier);
    void poseEngineRef.current.switchModelTier(tier);
  }, []);

  const resetFocusCircle = useCallback(() => {
    const canvas = canvasRef.current;
    const vw = canvas ? canvas.clientWidth : window.innerWidth;
    const vh = canvas ? canvas.clientHeight : window.innerHeight;
    circleRef.current = getDefaultCircle(vw, vh);
    setPinnedInstanceId(null);
    setLiveAnnouncement(getUIText(uiLang).lensResetHint);
  }, [uiLang]);

  // Helper to draw synthetic motion figure onto offscreen canvas for motion_loop mode
  const getMotionCanvas = useCallback((nowMs: number): HTMLCanvasElement => {
    if (!motionCanvasRef.current) {
      motionCanvasRef.current = document.createElement('canvas');
      motionCanvasRef.current.width = 720;
      motionCanvasRef.current.height = 1080;
    }
    const mc = motionCanvasRef.current;
    const mctx = mc.getContext('2d')!;
    const lms = getDevSampleLandmarks('motion_loop', nowMs);

    const grad = mctx.createRadialGradient(360, 400, 60, 360, 540, 680);
    grad.addColorStop(0, '#283548');
    grad.addColorStop(1, '#0b1019');
    mctx.fillStyle = grad;
    mctx.fillRect(0, 0, 720, 1080);

    const pt = (idx: number) => ({ x: lms[idx].x * 720, y: lms[idx].y * 1080 });
    const limb = (a: number, b: number, width: number, color = '#d69e7b') => {
      const pa = pt(a);
      const pb = pt(b);
      mctx.strokeStyle = color;
      mctx.lineWidth = width;
      mctx.lineCap = 'round';
      mctx.beginPath();
      mctx.moveTo(pa.x, pa.y);
      mctx.lineTo(pb.x, pb.y);
      mctx.stroke();
    };

    // Torso
    const ls = pt(11);
    const rs = pt(12);
    const lh = pt(23);
    const rh = pt(24);
    mctx.fillStyle = '#d69e7b';
    mctx.beginPath();
    mctx.moveTo(rs.x - 16, rs.y);
    mctx.lineTo(ls.x + 16, ls.y);
    mctx.lineTo(lh.x + 14, lh.y);
    mctx.lineTo(rh.x - 14, rh.y);
    mctx.closePath();
    mctx.fill();

    // Head & Neck
    const nose = pt(0);
    mctx.fillStyle = '#d69e7b';
    mctx.beginPath();
    mctx.ellipse(nose.x, nose.y, 44, 54, 0, 0, Math.PI * 2);
    mctx.fill();
    limb(11, 13, 34);
    limb(13, 15, 26);
    limb(12, 14, 34);
    limb(14, 16, 26);
    limb(23, 25, 52);
    limb(25, 27, 36);
    limb(24, 26, 52);
    limb(26, 28, 36);

    return mc;
  }, []);

  // Main animation & inference loop
  useEffect(() => {
    let rafId = 0;
    let frameTimes: number[] = [];
    let lowFpsSince = 0;
    let lastActiveId: string | null = null;
    let lastOrientation: DetectedOrientation = 'front';
    let lastHasPerson = false;
    let lastDock: 'top' | 'bottom' = 'bottom';

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = canvas.clientWidth || window.innerWidth;
      const vh = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== Math.round(vw * dpr) || canvas.height !== Math.round(vh * dpr)) {
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clamp focus circle inside current viewport
      const circle = circleRef.current;
      circle.radius = clamp(circle.radius, 64, Math.min(vw, vh) * 0.46);
      circle.cx = clamp(circle.cx, circle.radius * 0.5, vw - circle.radius * 0.5);
      circle.cy = clamp(circle.cy, circle.radius * 0.5, vh - circle.radius * 0.5);

      const nextDock: 'top' | 'bottom' = circle.cy >= vh * 0.48 ? 'top' : 'bottom';
      if (nextDock !== lastDock) {
        lastDock = nextDock;
        setDockPosition(nextDock);
      }

      const st = stateRef.current;
      const mirrored = st.inputMode === 'camera' && st.facingMode === 'user';

      let media: DrawableMedia | null = null;
      let rawLandmarks: PoseLandmark[] | null = null;

      if (st.isFrozen && frozenCanvasRef.current) {
        media = frozenCanvasRef.current;
        rawLandmarks = frozenLandmarksRef.current;
      } else if (st.inputMode === 'camera') {
        const video = videoRef.current;
        if (video && video.readyState >= 2 && video.videoWidth > 0) {
          media = video;
          rawLandmarks = poseEngineRef.current.detectVideoFrame(video, now);
        }
      } else if (st.inputMode === 'dev_sample') {
        if (st.activeDevSample === 'motion_loop') {
          media = getMotionCanvas(now);
          rawLandmarks = getDevSampleLandmarks('motion_loop', now);
        } else if (sampleImgRef.current && sampleImgRef.current.complete) {
          media = sampleImgRef.current;
          // Use bundled sample landmarks aligned to the sample image;
          // MediaPipe IMAGE detection also runs if available on uploaded images
          rawLandmarks = getDevSampleLandmarks(st.activeDevSample, now);
        }
      } else if (st.inputMode === 'uploaded_file') {
        if (uploadedIsVideoRef.current && videoRef.current && videoRef.current.readyState >= 2) {
          media = videoRef.current;
          rawLandmarks = poseEngineRef.current.detectVideoFrame(videoRef.current, now);
        } else if (uploadedImgRef.current && uploadedImgRef.current.complete) {
          media = uploadedImgRef.current;
          rawLandmarks = poseEngineRef.current.detectImage(uploadedImgRef.current);
        }
      }

      lastMediaRef.current = media;
      lastRawLandmarksRef.current = rawLandmarks;

      const personDetected = rawLandmarks !== null && rawLandmarks.length > 0;
      if (personDetected !== lastHasPerson) {
        lastHasPerson = personDetected;
        setHasPerson(personDetected);
      }

      const mediaW =
        media instanceof HTMLVideoElement
          ? media.videoWidth
          : media
            ? media.width
            : vw;
      const mediaH =
        media instanceof HTMLVideoElement
          ? media.videoHeight
          : media
            ? media.height
            : vh;

      const fit = st.inputMode === 'camera' ? 'cover' : 'contain';
      const viewport = computeFrameViewport(mediaW, mediaH, vw, vh, fit);

      let smoothedLandmarks = rawLandmarks;
      if (rawLandmarks && !st.isFrozen) {
        const shouldSmooth =
          st.inputMode === 'camera' ||
          (st.inputMode === 'dev_sample' && st.activeDevSample === 'motion_loop') ||
          (st.inputMode === 'uploaded_file' && uploadedIsVideoRef.current);
        smoothedLandmarks = shouldSmooth
          ? smootherRef.current.smooth(rawLandmarks, now)
          : rawLandmarks;
      }

      const orientRes = orientationRef.current.update(
        smoothedLandmarks,
        st.viewOverride
      );
      if (orientRes.view !== lastOrientation) {
        lastOrientation = orientRes.view;
        setDetectedOrientation(orientRes.view);
      }

      let structures: RenderedStructureInstance[] = [];
      let ghostBones: RenderedStructureInstance[] = [];

      if (smoothedLandmarks) {
        const rig = buildSegmentRig(smoothedLandmarks, viewport, mirrored);
        structures = projectStructuresToScreen(rig, st.layer, orientRes.view);
        if (st.layer === 'muscle') {
          ghostBones = projectStructuresToScreen(rig, 'bone', orientRes.view);
        }
      }

      lastInstancesRef.current = structures;
      const focusRes = selectFocusedStructure(
        structures,
        circle,
        st.pinnedInstanceId
      );

      // Only trigger React state update when active structure / pin / overlap list changes
      const newKey = `${focusRes.active?.instanceId ?? 'none'}|${focusRes.isPinned}|${focusRes.overlapping
        .map((o) => o.instanceId)
        .join(',')}`;
      if (newKey !== lastActiveId) {
        lastActiveId = newKey;
        setSelection(focusRes);
      }

      // Compute anchor point on Speech Cloud for leader line
      let cloudAnchor: ScreenPoint | null = null;
      if (focusRes.active) {
        const cloudEl = cloudRef.current;
        if (cloudEl) {
          const rect = cloudEl.getBoundingClientRect();
          cloudAnchor = {
            x: clamp(focusRes.active.anchor.x, rect.left + 20, rect.right - 20),
            y: nextDock === 'top' ? rect.bottom : rect.top
          };
        } else {
          cloudAnchor = {
            x: vw * 0.5,
            y: nextDock === 'top' ? 120 : vh - 180
          };
        }
      }

      renderAnatomyFrame({
        ctx,
        width: vw,
        height: vh,
        media,
        viewport,
        mirrored,
        layer: st.layer,
        circle,
        structures,
        ghostBones,
        active: focusRes.active,
        speechCloudAnchor: cloudAnchor,
        isFrozen: st.isFrozen
      });

      // Rolling FPS & automatic Lite model fallback
      frameTimes.push(now);
      while (frameTimes.length > 0 && now - frameTimes[0] > 1000) {
        frameTimes.shift();
      }
      const currentFps = frameTimes.length;
      if (frameTimes.length % 15 === 0) {
        setFps(currentFps);
      }

      if (
        st.inputMode === 'camera' &&
        st.modelTier === 'full' &&
        !st.isFrozen &&
        currentFps > 0 &&
        currentFps < 10
      ) {
        if (lowFpsSince === 0) lowFpsSince = now;
        else if (now - lowFpsSince > 2500) {
          lowFpsSince = 0;
          setModelTier('lite');
          void poseEngineRef.current.switchModelTier('lite');
        }
      } else {
        lowFpsSince = 0;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [getMotionCanvas]);

  // Pointer & touch handlers for drag, tap-to-pin, double-tap reset, pinch-zoom, wheel
  const handlePointerDown = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    activePointersRef.current.set(e.pointerId, { x, y });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture errors in tests
    }

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      dragStateRef.current.pinchStartDist = Math.hypot(
        pts[1].x - pts[0].x,
        pts[1].y - pts[0].y
      );
      dragStateRef.current.pinchStartRadius = circleRef.current.radius;
      dragStateRef.current.mode = null;
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const c = circleRef.current;
    const hx = c.cx + Math.SQRT1_2 * c.radius;
    const hy = c.cy + Math.SQRT1_2 * c.radius;
    const distToHandle = Math.hypot(x - hx, y - hy);
    const distToCenter = Math.hypot(x - c.cx, y - c.cy);

    if (distToHandle <= 28) {
      dragStateRef.current = {
        ...dragStateRef.current,
        mode: 'resize',
        startX: x,
        startY: y,
        moved: false
      };
    } else if (distToCenter <= c.radius + 16) {
      dragStateRef.current = {
        ...dragStateRef.current,
        mode: 'move',
        startX: x,
        startY: y,
        offsetX: x - c.cx,
        offsetY: y - c.cy,
        moved: false
      };
    } else {
      dragStateRef.current.mode = null;
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x, y });
    }

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const distNow = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (dragStateRef.current.pinchStartDist > 10) {
        const scale = distNow / dragStateRef.current.pinchStartDist;
        circleRef.current.radius = clamp(
          dragStateRef.current.pinchStartRadius * scale,
          64,
          Math.min(rect.width, rect.height) * 0.46
        );
      }
      return;
    }

    const ds = dragStateRef.current;
    if (!ds.mode) return;
    if (Math.hypot(x - ds.startX, y - ds.startY) > 6) {
      ds.moved = true;
    }
    if (!ds.moved) return;

    if (ds.mode === 'move') {
      circleRef.current.cx = clamp(
        x - ds.offsetX,
        circleRef.current.radius * 0.5,
        rect.width - circleRef.current.radius * 0.5
      );
      circleRef.current.cy = clamp(
        y - ds.offsetY,
        circleRef.current.radius * 0.5,
        rect.height - circleRef.current.radius * 0.5
      );
    } else if (ds.mode === 'resize') {
      const r = Math.hypot(x - circleRef.current.cx, y - circleRef.current.cy);
      circleRef.current.radius = clamp(
        r,
        64,
        Math.min(rect.width, rect.height) * 0.46
      );
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    const canvas = canvasRef.current;
    activePointersRef.current.delete(e.pointerId);
    if (canvas) {
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }

    const ds = dragStateRef.current;
    if (ds.mode === 'move' && !ds.moved && canvas) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double-tap resets focus circle & clears pin
        resetFocusCircle();
        lastTapTimeRef.current = 0;
      } else {
        lastTapTimeRef.current = now;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const hit = findStructureAtPoint(
          lastInstancesRef.current,
          circleRef.current,
          x,
          y
        );
        setPinnedInstanceId(hit ? hit.instanceId : null);
      }
    }
    ds.mode = null;
  };

  const handleWheel = (e: WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    circleRef.current.radius = clamp(
      circleRef.current.radius - e.deltaY * 0.14,
      64,
      Math.min(rect.width, rect.height) * 0.46
    );
  };

  const handleLensKeyDown = (e: KeyboardEvent) => {
    const step = 15;
    const canvas = canvasRef.current;
    const vw = canvas ? canvas.clientWidth : window.innerWidth;
    const vh = canvas ? canvas.clientHeight : window.innerHeight;
    let handled = true;

    if (e.key === 'ArrowLeft') {
      circleRef.current.cx = clamp(circleRef.current.cx - step, 40, vw - 40);
    } else if (e.key === 'ArrowRight') {
      circleRef.current.cx = clamp(circleRef.current.cx + step, 40, vw - 40);
    } else if (e.key === 'ArrowUp') {
      circleRef.current.cy = clamp(circleRef.current.cy - step, 40, vh - 40);
    } else if (e.key === 'ArrowDown') {
      circleRef.current.cy = clamp(circleRef.current.cy + step, 40, vh - 40);
    } else if (e.key === '+' || e.key === '=' || e.key === ']') {
      circleRef.current.radius = clamp(
        circleRef.current.radius + 12,
        64,
        Math.min(vw, vh) * 0.46
      );
    } else if (e.key === '-' || e.key === '_' || e.key === '[') {
      circleRef.current.radius = clamp(
        circleRef.current.radius - 12,
        64,
        Math.min(vw, vh) * 0.46
      );
    } else if (e.key === 'Enter' || e.key === ' ') {
      resetFocusCircle();
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      if (e.key.startsWith('Arrow')) {
        setLiveAnnouncement(getUIText(uiLang).lensMoveAria);
      }
    }
  };

  const t = getUIText(uiLang);

  return (
    <main class="app-shell">
      <video
        ref={videoRef}
        playsInline
        muted
        class="visually-hidden"
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        class="lens-canvas"
        data-testid="lens-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Accessible keyboard handle for moving/resizing the focus lens */}
      <button
        type="button"
        class="lens-kbd-handle"
        aria-label={t.lensHandleAria}
        onKeyDown={handleLensKeyDown}
        data-testid="lens-kbd-handle"
      >
        <span aria-hidden="true">⊕</span>
      </button>

      <div class="visually-hidden" aria-live="polite">
        {liveAnnouncement}
      </div>

      <SpeechCloud
        cloudRef={cloudRef}
        selection={selection}
        nameLang={nameLang}
        uiLang={uiLang}
        dockPosition={dockPosition}
        hasPerson={hasPerson}
        onSelectOverlap={(id) => setPinnedInstanceId(id)}
        onClearPin={() => setPinnedInstanceId(null)}
      />

      <CameraPrompt
        state={promptState}
        uiLang={uiLang}
        hasPerson={hasPerson}
        onEnableCamera={() => void startCamera(facingMode)}
        onStartDevMode={() => handleSelectDevSample(activeDevSample)}
        onToggleUiLang={() => setUiLang((l) => (l === 'de' ? 'en' : 'de'))}
      />

      <ControlBar
        layer={layer}
        onToggleLayer={() =>
          setLayer((prev) => (prev === 'muscle' ? 'bone' : 'muscle'))
        }
        isFrozen={isFrozen}
        onToggleFreeze={handleToggleFreeze}
        nameLang={nameLang}
        uiLang={uiLang}
        onCycleLanguage={handleCycleLanguage}
        viewOverride={viewOverride}
        detectedOrientation={detectedOrientation}
        onCycleViewOverride={handleCycleViewOverride}
        canFlipCamera={canFlipCamera}
        onFlipCamera={handleFlipCamera}
        inputMode={inputMode}
        activeDevSample={activeDevSample}
        onSelectCamera={() => void startCamera(facingMode)}
        onSelectDevSample={handleSelectDevSample}
        onUploadFile={handleUploadFile}
        modelTier={modelTier}
        onChangeModelTier={handleChangeModelTier}
        fps={fps}
      />
    </main>
  );
}
