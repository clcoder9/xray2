import {
  FaceLandmarker,
  FilesetResolver,
  PoseLandmarker
} from '@mediapipe/tasks-vision';
import { estimateJawOpenFromLandmarks } from './orientationDetector';
import { selectPrimaryPerson } from './personSelector';
import {
  MP_LANDMARK,
  type FaceTrackingResult,
  type PoseLandmark
} from './types';

export type PoseModelTier = 'full' | 'lite';

export interface PoseEngineStatus {
  ready: boolean;
  loading: boolean;
  modelTier: PoseModelTier;
  backend: 'mediapipe' | 'fixture-fallback';
  error: string | null;
  faceReady: boolean;
}

const MODEL_PATHS: Record<PoseModelTier, string> = {
  full: './models/pose_landmarker_full.task',
  lite: './models/pose_landmarker_lite.task'
};

const FACE_MODEL_PATH = './models/face_landmarker.task';
const WASM_PATH = './models/wasm';

/**
 * Estimates jaw opening [0..1] by combining 33-landmark mouth proportions with a
 * fast 32x32 offscreen luminance scan of the oral aperture between MOUTH_LEFT and MOUTH_RIGHT.
 */
export function estimateJawOpenFromPoseAndROI(
  landmarks: readonly PoseLandmark[] | null,
  media?: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | null,
  roiCtx?: CanvasRenderingContext2D | null
): number {
  if (!landmarks || landmarks.length === 0) return 0;

  const landmarkJaw = estimateJawOpenFromLandmarks(landmarks);
  if (!media || !roiCtx) return landmarkJaw;

  const ml = landmarks[MP_LANDMARK.MOUTH_LEFT];
  const mr = landmarks[MP_LANDMARK.MOUTH_RIGHT];
  const nose = landmarks[MP_LANDMARK.NOSE];
  if (
    !ml ||
    !mr ||
    !nose ||
    (ml.visibility ?? 0) < 0.35 ||
    (mr.visibility ?? 0) < 0.35
  ) {
    return landmarkJaw;
  }

  const srcW =
    media instanceof HTMLVideoElement ? media.videoWidth : media.width;
  const srcH =
    media instanceof HTMLVideoElement ? media.videoHeight : media.height;
  if (srcW <= 0 || srcH <= 0) return landmarkJaw;

  const mouthCx = ((ml.x + mr.x) * 0.5) * srcW;
  const mouthCy = ((ml.y + mr.y) * 0.5) * srcH;
  const mouthSpanPx = Math.hypot((ml.x - mr.x) * srcW, (ml.y - mr.y) * srcH);
  const noseToMouthPx = Math.abs(mouthCy - nose.y * srcH);
  const roiSize = Math.max(12, Math.max(mouthSpanPx * 1.15, noseToMouthPx * 1.4));

  const sx = Math.max(0, Math.min(srcW - 4, mouthCx - roiSize * 0.5));
  const sy = Math.max(0, Math.min(srcH - 4, mouthCy - roiSize * 0.3));
  const sw = Math.min(srcW - sx, roiSize);
  const sh = Math.min(srcH - sy, roiSize);
  if (sw < 6 || sh < 6) return landmarkJaw;

  try {
    roiCtx.clearRect(0, 0, 32, 32);
    roiCtx.drawImage(media, sx, sy, sw, sh, 0, 0, 32, 32);
    const imgData = roiCtx.getImageData(0, 0, 32, 32).data;

    // Sample center 12 columns (x=10..21) across rows 4..28 to detect dark oral cavity height
    const rowLums: number[] = [];
    for (let y = 4; y < 28; y++) {
      let sum = 0;
      for (let x = 10; x < 22; x++) {
        const idx = (y * 32 + x) * 4;
        sum += imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114;
      }
      rowLums.push(sum / 12);
    }

    // Upper/lower lip baseline luminance vs darkest interior oral rows
    const topRef = (rowLums[0] + rowLums[1] + rowLums[2]) / 3;
    const botRef =
      (rowLums[rowLums.length - 1] +
        rowLums[rowLums.length - 2] +
        rowLums[rowLums.length - 3]) /
      3;
    const lipRef = (topRef + botRef) * 0.5;
    if (lipRef < 25) return landmarkJaw;

    const minLum = Math.min(...rowLums.slice(3, rowLums.length - 3));
    const contrast = (lipRef - minLum) / lipRef;
    if (contrast < 0.28) return landmarkJaw;

    const darkThreshold = minLum + (lipRef - minLum) * 0.45;
    let darkRows = 0;
    for (let i = 3; i < rowLums.length - 3; i++) {
      if (rowLums[i] <= darkThreshold) darkRows++;
    }
    const roiOpen = Math.max(0, Math.min(1, (darkRows - 2.5) / 10.5));
    return Math.max(landmarkJaw, roiOpen * 0.85);
  } catch {
    return landmarkJaw;
  }
}

/**
 * Manages on-device MediaPipe PoseLandmarker and hybrid FaceLandmarker
 * loaded strictly from local bundled WASM and .task model files (zero CDN requests).
 */
export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private currentMode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private modelTier: PoseModelTier = 'full';
  private loading = false;
  private initError: string | null = null;
  private lastVideoTimestampMs = -1;
  private lastFaceTimestampMs = -1;

  getStatus(): PoseEngineStatus {
    return {
      ready: this.landmarker !== null,
      loading: this.loading,
      modelTier: this.modelTier,
      backend: this.landmarker ? 'mediapipe' : 'fixture-fallback',
      error: this.initError,
      faceReady: this.faceLandmarker !== null
    };
  }

  getModelTier(): PoseModelTier {
    return this.modelTier;
  }

  async init(
    tier: PoseModelTier = 'full',
    runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO'
  ): Promise<boolean> {
    if (
      this.landmarker &&
      this.modelTier === tier &&
      this.currentMode === runningMode
    ) {
      return true;
    }

    this.loading = true;
    this.initError = null;
    try {
      this.dispose();
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      let landmarker: PoseLandmarker;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[tier],
            delegate: 'GPU'
          },
          runningMode,
          numPoses: 3,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      } catch {
        // Fallback to CPU delegate if WebGL GPU delegate is unavailable
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[tier],
            delegate: 'CPU'
          },
          runningMode,
          numPoses: 3,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      }
      this.landmarker = landmarker;
      this.modelTier = tier;
      this.currentMode = runningMode;
      this.lastVideoTimestampMs = -1;
      this.lastFaceTimestampMs = -1;

      // Best-effort local FaceLandmarker initialization for exact jawOpen + 3D skull yaw
      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_MODEL_PATH,
            delegate: 'GPU'
          },
          runningMode,
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true
        });
      } catch {
        try {
          this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: FACE_MODEL_PATH,
              delegate: 'CPU'
            },
            runningMode,
            numFaces: 1,
            minFaceDetectionConfidence: 0.45,
            minFacePresenceConfidence: 0.45,
            minTrackingConfidence: 0.45,
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true
          });
        } catch {
          this.faceLandmarker = null;
        }
      }

      this.loading = false;
      return true;
    } catch (err) {
      this.initError = err instanceof Error ? err.message : String(err);
      this.loading = false;
      return false;
    }
  }

  async switchModelTier(tier: PoseModelTier): Promise<boolean> {
    if (tier === this.modelTier && this.landmarker) return true;
    return this.init(tier, this.currentMode);
  }

  async ensureMode(mode: 'IMAGE' | 'VIDEO'): Promise<boolean> {
    if (this.landmarker && this.currentMode === mode) return true;
    if (!this.landmarker) {
      return this.init(this.modelTier, mode);
    }
    try {
      await this.landmarker.setOptions({ runningMode: mode });
      if (this.faceLandmarker) {
        await this.faceLandmarker.setOptions({ runningMode: mode });
      }
      this.currentMode = mode;
      this.lastVideoTimestampMs = -1;
      this.lastFaceTimestampMs = -1;
      return true;
    } catch {
      return this.init(this.modelTier, mode);
    }
  }

  detectImage(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): PoseLandmark[] | null {
    if (!this.landmarker || this.currentMode !== 'IMAGE') return null;
    try {
      const result = this.landmarker.detect(source);
      return selectPrimaryPerson(result.landmarks ?? []);
    } catch {
      return null;
    }
  }

  detectVideoFrame(
    source: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): PoseLandmark[] | null {
    if (!this.landmarker || this.currentMode !== 'VIDEO') return null;
    const monotonicTs =
      timestampMs <= this.lastVideoTimestampMs
        ? this.lastVideoTimestampMs + 1
        : timestampMs;
    this.lastVideoTimestampMs = monotonicTs;
    try {
      const result = this.landmarker.detectForVideo(source, monotonicTs);
      return selectPrimaryPerson(result.landmarks ?? []);
    } catch {
      return null;
    }
  }

  private parseFaceResult(
    result: ReturnType<FaceLandmarker['detect']>
  ): FaceTrackingResult | null {
    const faceLms = result.faceLandmarks?.[0];
    if (!faceLms || faceLms.length < 200) return null;

    // 1. Jaw open blendshape + inner lip aperture ratio (landmarks 13 upper inner lip, 14 lower inner lip)
    const jawCat = result.faceBlendshapes?.[0]?.categories?.find(
      (c) => c.categoryName === 'jawOpen'
    );
    const blendJaw = jawCat ? jawCat.score : 0;

    const upperLip = faceLms[13];
    const lowerLip = faceLms[14];
    const forehead = faceLms[10];
    const chin = faceLms[152];
    let lipRatio = 0;
    if (upperLip && lowerLip && forehead && chin) {
      const faceH = Math.max(
        0.02,
        Math.hypot(chin.x - forehead.x, chin.y - forehead.y)
      );
      const lipGap = Math.hypot(
        lowerLip.x - upperLip.x,
        lowerLip.y - upperLip.y
      );
      lipRatio = Math.max(0, Math.min(1, ((lipGap / faceH) - 0.015) / 0.16));
    }

    const jawOpen = Math.max(
      0,
      Math.min(1, blendJaw > 0 ? blendJaw * 0.7 + lipRatio * 0.3 : lipRatio)
    );

    // 2. Extract head yaw from 4x4 facialTransformationMatrixes when present
    let yawRad: number | undefined;
    let pitchRad: number | undefined;
    const mat = result.facialTransformationMatrixes?.[0]?.data;
    if (mat && mat.length >= 16) {
      // Column-major / row-major rotation check: forward vector z-axis in column 2 (mat[2], mat[6], mat[10])
      // In MediaPipe FaceLandmarker, mat is row-major 4x4: forward = (mat[2], mat[6], mat[10])
      const fx = mat[2];
      const fy = mat[6];
      const fz = mat[10];
      if (Number.isFinite(fx) && Number.isFinite(fz)) {
        yawRad = Math.atan2(-fx, fz);
        pitchRad = Math.asin(Math.max(-1, Math.min(1, fy)));
      }
    }

    return {
      jawOpen,
      yawRad,
      pitchRad,
      chinPoint: chin ? { x: chin.x, y: chin.y } : undefined
    };
  }

  detectFaceImage(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): FaceTrackingResult | null {
    if (!this.faceLandmarker || this.currentMode !== 'IMAGE') return null;
    try {
      const res = this.faceLandmarker.detect(source);
      return this.parseFaceResult(res);
    } catch {
      return null;
    }
  }

  detectFaceVideoFrame(
    source: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): FaceTrackingResult | null {
    if (!this.faceLandmarker || this.currentMode !== 'VIDEO') return null;
    const monotonicTs =
      timestampMs <= this.lastFaceTimestampMs
        ? this.lastFaceTimestampMs + 1
        : timestampMs;
    this.lastFaceTimestampMs = monotonicTs;
    try {
      const res = this.faceLandmarker.detectForVideo(source, monotonicTs);
      return this.parseFaceResult(res);
    } catch {
      return null;
    }
  }

  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignore close errors during disposal
      }
      this.landmarker = null;
    }
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch {
        // Ignore close errors during disposal
      }
      this.faceLandmarker = null;
    }
  }
}
