import {
  MP_LANDMARK,
  type DetectedOrientation,
  type FaceTrackingResult,
  type HeadPoseEstimate,
  type PoseLandmark,
  type ViewModeOverride
} from './types';

export interface OrientationResult {
  view: DetectedOrientation;
  rawScore: number; // [-1, 1] where +1 = strongly front, -1 = strongly back
  smoothedScore: number;
  bodyYawDeg: number; // [-180, 180] where 0=front, +90=left side toward camera, -90=right side toward camera, +-180=back
  head: HeadPoseEstimate;
}

export interface BodyYawEstimate {
  cosYaw: number; // front (+1) vs back (-1)
  sinYaw: number; // left side toward camera (+1) vs right side toward camera (-1)
  yawRad: number;
  yawDeg: number;
  shRatio: number; // projected horizontal shoulder span / coronal reference span
  rawView: DetectedOrientation;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function vis(lm: PoseLandmark | undefined): number {
  return lm?.visibility ?? 0;
}

function isVis(lm: PoseLandmark | undefined, minVis = 0.35): lm is PoseLandmark {
  return lm !== undefined && (lm.visibility ?? 1) >= minVis;
}

function dist2d(a: PoseLandmark, b: PoseLandmark): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function estimateRefShoulderWidth(landmarks: readonly PoseLandmark[]): number {
  const ls = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[MP_LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[MP_LANDMARK.LEFT_HIP];
  const rh = landmarks[MP_LANDMARK.RIGHT_HIP];
  const le = landmarks[MP_LANDMARK.LEFT_ELBOW];
  const re = landmarks[MP_LANDMARK.RIGHT_ELBOW];
  const lEar = landmarks[MP_LANDMARK.LEFT_EAR];
  const rEar = landmarks[MP_LANDMARK.RIGHT_EAR];

  const dxSh = isVis(ls) && isVis(rs) ? Math.abs(ls.x - rs.x) : 0;

  let torsoLen = 0;
  if (isVis(ls) && isVis(rs) && isVis(lh) && isVis(rh)) {
    const shMidX = (ls.x + rs.x) * 0.5;
    const shMidY = (ls.y + rs.y) * 0.5;
    const hipMidX = (lh.x + rh.x) * 0.5;
    const hipMidY = (lh.y + rh.y) * 0.5;
    torsoLen = Math.hypot(shMidX - hipMidX, shMidY - hipMidY);
  }

  let armLen = 0;
  if (isVis(ls) && isVis(le)) armLen = Math.max(armLen, dist2d(ls, le));
  if (isVis(rs) && isVis(re)) armLen = Math.max(armLen, dist2d(rs, re));

  const earSpan = isVis(lEar) && isVis(rEar) ? dist2d(lEar, rEar) : 0;

  return Math.max(
    0.14,
    dxSh,
    torsoLen * 0.56,
    armLen * 1.15,
    earSpan * 2.2
  );
}

/**
 * Computes raw front/back evidence score in [-1, +1] from unmirrored
 * normalized pose landmarks.
 *
 * Uses posture-invariant torso/limb reference scaling so side-on shoulders
 * smoothly approach 0 instead of falsely pinning to +-1.
 */
export function computeOrientationScore(landmarks: readonly PoseLandmark[]): number {
  const ls = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[MP_LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[MP_LANDMARK.LEFT_HIP];
  const rh = landmarks[MP_LANDMARK.RIGHT_HIP];
  const nose = landmarks[MP_LANDMARK.NOSE];
  const le = landmarks[MP_LANDMARK.LEFT_EYE];
  const re = landmarks[MP_LANDMARK.RIGHT_EYE];
  const ml = landmarks[MP_LANDMARK.MOUTH_LEFT];
  const mr = landmarks[MP_LANDMARK.MOUTH_RIGHT];

  const refShoulderWidth = estimateRefShoulderWidth(landmarks);
  const refHipWidth = Math.max(0.09, refShoulderWidth * 0.68);

  let score = 0;
  let totalWeight = 0;

  // 1. Shoulder horizontal ordering normalized by coronal reference width
  if (isVis(ls) && isVis(rs)) {
    const dx = ls.x - rs.x;
    const normalizedDx = clamp(dx / (refShoulderWidth * 0.85), -1, 1);
    score += normalizedDx * 0.55;
    totalWeight += 0.55;
  }

  // 2. Hip horizontal ordering normalized by coronal hip reference width
  if (isVis(lh) && isVis(rh)) {
    const dx = lh.x - rh.x;
    const normalizedDx = clamp(dx / (refHipWidth * 0.85), -1, 1);
    score += normalizedDx * 0.25;
    totalWeight += 0.25;
  }

  // 3. Facial landmark visibility & z-depth relative to shoulders
  const faceLandmarks = [nose, le, re, ml, mr].filter(Boolean) as PoseLandmark[];
  if (faceLandmarks.length > 0) {
    const avgFaceVis =
      faceLandmarks.reduce((acc, lm) => acc + (lm.visibility ?? 0.5), 0) /
      faceLandmarks.length;
    // Visibility >= 0.65 implies facing camera; <= 0.35 implies facing away
    let faceSignal = (avgFaceVis - 0.5) * 2;
    if (nose && ls && rs) {
      const shoulderZ = (ls.z + rs.z) * 0.5;
      // Negative z in MediaPipe means closer to camera
      if (nose.z < shoulderZ - 0.04) faceSignal = Math.max(faceSignal, 0.5);
      else if (nose.z > shoulderZ + 0.04) faceSignal = Math.min(faceSignal, -0.5);
    }
    score += clamp(faceSignal, -1, 1) * 0.2;
    totalWeight += 0.2;
  }

  if (totalWeight === 0) return 0;
  return clamp(score / totalWeight, -1, 1);
}

/**
 * Computes multi-cue body yaw (front, back, left side, right side) from unmirrored
 * normalized 33-landmark pose data.
 */
export function computeBodyYawAndSideScore(
  landmarks: readonly PoseLandmark[]
): BodyYawEstimate {
  const ls = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[MP_LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[MP_LANDMARK.LEFT_HIP];
  const rh = landmarks[MP_LANDMARK.RIGHT_HIP];
  const nose = landmarks[MP_LANDMARK.NOSE];
  const lEar = landmarks[MP_LANDMARK.LEFT_EAR];
  const rEar = landmarks[MP_LANDMARK.RIGHT_EAR];
  const lElbow = landmarks[MP_LANDMARK.LEFT_ELBOW];
  const rElbow = landmarks[MP_LANDMARK.RIGHT_ELBOW];
  const lKnee = landmarks[MP_LANDMARK.LEFT_KNEE];
  const rKnee = landmarks[MP_LANDMARK.RIGHT_KNEE];
  const lHeel = landmarks[MP_LANDMARK.LEFT_HEEL];
  const rHeel = landmarks[MP_LANDMARK.RIGHT_HEEL];
  const lFoot = landmarks[MP_LANDMARK.LEFT_FOOT_INDEX];
  const rFoot = landmarks[MP_LANDMARK.RIGHT_FOOT_INDEX];

  const refShoulderWidth = estimateRefShoulderWidth(landmarks);
  const hasShoulders = isVis(ls, 0.25) && isVis(rs, 0.25);
  const shDx = hasShoulders ? ls!.x - rs!.x : 0;
  const shRatio = hasShoulders ? Math.abs(shDx) / refShoulderWidth : 1;

  // Front/back component from shoulder/hip ordering + face visibility
  let cosYaw = computeOrientationScore(landmarks);

  // If shoulders are nearly stacked horizontally (< 0.35 ref width), suppress face bias
  // on cosYaw so profile views with visible nose don't pull cosYaw back to 'front'.
  if (hasShoulders && shRatio < 0.38) {
    const hipDx = isVis(lh, 0.25) && isVis(rh, 0.25) ? lh!.x - rh!.x : 0;
    const shSigned = clamp(shDx / (refShoulderWidth * 0.85), -1, 1);
    const hipSigned = clamp(hipDx / (refShoulderWidth * 0.68 * 0.85), -1, 1);
    cosYaw = clamp(shSigned * 0.7 + hipSigned * 0.3, -1, 1);
  }

  // Lateral sign (+1 = anatomical LEFT closer to camera, -1 = anatomical RIGHT closer to camera)
  let lateralVotes = 0;
  let lateralWeight = 0;

  // Cue A: MediaPipe Z-depth difference (negative z is closer)
  if (ls && rs) {
    const dzSh = rs.z - ls.z;
    const dzHip = lh && rh ? rh.z - lh.z : 0;
    const zSignal = clamp((dzSh * 0.65 + dzHip * 0.35) / 0.14, -1, 1);
    lateralVotes += zSignal * 0.42;
    lateralWeight += 0.42;
  }

  // Cue B: Visibility asymmetry between left and right chains
  const leftChain = [lEar, ls, lElbow, lh, lKnee].filter(Boolean) as PoseLandmark[];
  const rightChain = [rEar, rs, rElbow, rh, rKnee].filter(Boolean) as PoseLandmark[];
  if (leftChain.length > 0 && rightChain.length > 0) {
    const lVis = leftChain.reduce((s, p) => s + vis(p), 0) / leftChain.length;
    const rVis = rightChain.reduce((s, p) => s + vis(p), 0) / rightChain.length;
    const visSignal = clamp((lVis - rVis) * 2.5, -1, 1);
    lateralVotes += visSignal * 0.25;
    lateralWeight += 0.25;
  }

  // Cue C: Sagittal facing vector (in raw unmirrored coords: left side toward camera -> facing +X)
  if (hasShoulders) {
    const shMidX = (ls!.x + rs!.x) * 0.5;
    let sagittalSignal = 0;
    let sagCount = 0;
    if (isVis(nose, 0.3)) {
      sagittalSignal += clamp((nose!.x - shMidX) / (refShoulderWidth * 0.3), -1, 1);
      sagCount++;
    }
    if (isVis(lFoot, 0.3) && isVis(lHeel, 0.3)) {
      sagittalSignal += clamp((lFoot!.x - lHeel!.x) / (refShoulderWidth * 0.25), -1, 1);
      sagCount++;
    }
    if (isVis(rFoot, 0.3) && isVis(rHeel, 0.3)) {
      sagittalSignal += clamp((rFoot!.x - rHeel!.x) / (refShoulderWidth * 0.25), -1, 1);
      sagCount++;
    }
    if (sagCount > 0) {
      lateralVotes += (sagittalSignal / sagCount) * 0.33;
      lateralWeight += 0.33;
    }
  }

  const lateralSign = lateralWeight > 0 ? clamp(lateralVotes / lateralWeight, -1, 1) : 0;
  // Magnitude of sinYaw grows as shoulders narrow relative to coronal width
  const sideMag = clamp(Math.sqrt(Math.max(0, 1 - Math.min(1, shRatio) * Math.min(1, shRatio))), 0, 1);
  const sinYaw =
    Math.abs(lateralSign) > 0.08
      ? Math.sign(lateralSign) * Math.max(sideMag * Math.abs(lateralSign), sideMag * 0.72)
      : 0;

  const yawRad = Math.atan2(sinYaw, cosYaw);
  const yawDeg = (yawRad * 180) / Math.PI;

  let rawView: DetectedOrientation = cosYaw >= 0 ? 'front' : 'back';
  if (hasShoulders && shRatio < 0.46 && Math.abs(sinYaw) > 0.42) {
    rawView = sinYaw >= 0 ? 'left' : 'right';
  }

  return {
    cosYaw,
    sinYaw,
    yawRad,
    yawDeg,
    shRatio,
    rawView
  };
}

/**
 * Estimates jaw opening ratio in [0..1] purely from 33-point pose landmarks
 * when FaceLandmarker is unavailable or inactive.
 */
export function estimateJawOpenFromLandmarks(
  landmarks: readonly PoseLandmark[]
): number {
  const nose = landmarks[MP_LANDMARK.NOSE];
  const le = landmarks[MP_LANDMARK.LEFT_EYE];
  const re = landmarks[MP_LANDMARK.RIGHT_EYE];
  const ml = landmarks[MP_LANDMARK.MOUTH_LEFT];
  const mr = landmarks[MP_LANDMARK.MOUTH_RIGHT];

  if (!isVis(nose, 0.3) || !isVis(ml, 0.3) || !isVis(mr, 0.3)) return 0;

  const mouthMidX = (ml.x + mr.x) * 0.5;
  const mouthMidY = (ml.y + mr.y) * 0.5;
  const mouthSpan = Math.hypot(ml.x - mr.x, ml.y - mr.y);

  if (isVis(le, 0.3) && isVis(re, 0.3)) {
    const eyeMidX = (le.x + re.x) * 0.5;
    const eyeMidY = (le.y + re.y) * 0.5;
    const eyeNoseDist = Math.hypot(nose.x - eyeMidX, nose.y - eyeMidY);
    const noseMouthDist = Math.hypot(mouthMidX - nose.x, mouthMidY - nose.y);
    const eyeSpan = Math.hypot(le.x - re.x, le.y - re.y);

    if (eyeNoseDist > 1e-4 && eyeSpan > 1e-4) {
      const dropRatio = noseMouthDist / eyeNoseDist;
      const widthRatio = mouthSpan / eyeSpan;
      // Closed baseline: dropRatio ~ 1.05..1.35, widthRatio ~ 0.65..0.75
      const dropOpen = clamp((dropRatio - 1.48) / 0.55, 0, 1);
      const narrowOpen = clamp((0.54 - widthRatio) / 0.22, 0, 1);
      return clamp(Math.max(dropOpen, dropOpen * 0.65 + narrowOpen * 0.35), 0, 1);
    }
  }

  return 0;
}

/**
 * Computes independent skull orientation (yaw, pitch, cardinal head view, and jawOpen)
 * from 33 pose landmarks and optional FaceLandmarker result.
 */
export function computeHeadPose(
  landmarks: readonly PoseLandmark[],
  bodyView: DetectedOrientation,
  bodyYawRad: number,
  faceResult?: FaceTrackingResult | null
): HeadPoseEstimate {
  const nose = landmarks[MP_LANDMARK.NOSE];
  const le = landmarks[MP_LANDMARK.LEFT_EYE];
  const re = landmarks[MP_LANDMARK.RIGHT_EYE];
  const lEar = landmarks[MP_LANDMARK.LEFT_EAR];
  const rEar = landmarks[MP_LANDMARK.RIGHT_EAR];
  const ml = landmarks[MP_LANDMARK.MOUTH_LEFT];
  const mr = landmarks[MP_LANDMARK.MOUTH_RIGHT];
  const ls = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[MP_LANDMARK.RIGHT_SHOULDER];

  const jawOpen =
    faceResult !== undefined && faceResult !== null
      ? clamp(faceResult.jawOpen, 0, 1)
      : estimateJawOpenFromLandmarks(landmarks);

  const faceLms = [nose, le, re, ml, mr].filter(Boolean) as PoseLandmark[];
  const avgFaceVis =
    faceLms.length > 0
      ? faceLms.reduce((s, p) => s + vis(p), 0) / faceLms.length
      : 0;

  const hasBothEars = isVis(lEar, 0.3) && isVis(rEar, 0.3);
  const hasBothEyes = isVis(le, 0.3) && isVis(re, 0.3);

  const refShoulderWidth = estimateRefShoulderWidth(landmarks);
  const headRadius = Math.max(
    0.032,
    hasBothEars ? dist2d(lEar!, rEar!) * 0.58 : 0,
    hasBothEyes ? dist2d(le!, re!) * 1.25 : 0,
    refShoulderWidth * 0.23
  );

  // Determine ear midpoint (or fallback from shoulder mid)
  let earMidX = 0.5;
  let earMidY = 0.2;
  let hasEarAnchor = false;
  if (hasBothEars) {
    earMidX = (lEar!.x + rEar!.x) * 0.5;
    earMidY = (lEar!.y + rEar!.y) * 0.5;
    hasEarAnchor = true;
  } else if (isVis(lEar, 0.3) || isVis(rEar, 0.3)) {
    const visEar = isVis(lEar, 0.3) ? lEar! : rEar!;
    earMidX = visEar.x;
    earMidY = visEar.y;
    hasEarAnchor = true;
  } else if (isVis(ls, 0.3) && isVis(rs, 0.3)) {
    earMidX = (ls!.x + rs!.x) * 0.5;
    earMidY = (ls!.y + rs!.y) * 0.5 - headRadius * 1.4;
    hasEarAnchor = true;
  }

  let pitchRatio = 0;
  if (nose && hasEarAnchor) {
    pitchRatio = clamp((nose.y - earMidY) / headRadius, -1, 1);
  }

  // Estimate screen-space nose horizontal shift relative to cranial center
  let noseShiftX = 0;
  if (isVis(nose, 0.25) && hasEarAnchor) {
    noseShiftX = clamp((nose!.x - earMidX) / (headRadius * 0.92), -1.25, 1.25);
  }

  // Eye-to-ear bilateral asymmetry and ear depth cue
  let earZSignal = 0;
  if (lEar && rEar) {
    earZSignal = clamp((rEar.z - lEar.z) / 0.08, -1, 1);
  }

  let earVisSignal = 0;
  if (lEar && rEar) {
    earVisSignal = clamp((vis(lEar) - vis(rEar)) * 2.0, -1, 1);
  }

  // In raw unmirrored coordinates:
  // - If person is facing camera (front) and turns head toward viewer's RIGHT (+X),
  //   their anatomical RIGHT side becomes visible to camera (yaw < 0, view = 'right', facingSign = +1).
  // - If person turns head toward viewer's LEFT (-X),
  //   their anatomical LEFT side becomes visible to camera (yaw > 0, view = 'left', facingSign = -1).
  // - HOWEVER, if the body is in 'left' profile (anatomical left side facing camera), nose points +X (noseShiftX > 0)
  //   and earZSignal > 0 (left ear closer than right ear).
  let anatomicalLeftScore = 0;
  let yawSignWeight = 0;

  if (Math.abs(earZSignal) > 0.08) {
    anatomicalLeftScore += earZSignal * 0.55;
    yawSignWeight += 0.55;
  }
  if (Math.abs(earVisSignal) > 0.1) {
    anatomicalLeftScore += earVisSignal * 0.35;
    yawSignWeight += 0.35;
  }
  if (hasBothEars && isVis(nose, 0.25)) {
    // Check whether ears are in frontal ordering (lEar.x > rEar.x) or crossed/stacked
    const earDx = lEar!.x - rEar!.x;
    if (Math.abs(earDx) > headRadius * 0.35) {
      // Frontal/back ordering: nose moving toward rEar (noseShiftX < 0 when lEar.x > rEar.x) exposes LEFT side
      const orderingSign = Math.sign(earDx);
      anatomicalLeftScore += -noseShiftX * orderingSign * 0.4;
      yawSignWeight += 0.4;
    } else if (bodyView === 'left' || bodyView === 'right') {
      anatomicalLeftScore += (bodyView === 'left' ? 1 : -1) * 0.4;
      yawSignWeight += 0.4;
    }
  } else if (isVis(lEar, 0.3) && !isVis(rEar, 0.3)) {
    anatomicalLeftScore += 0.65;
    yawSignWeight += 0.65;
  } else if (isVis(rEar, 0.3) && !isVis(lEar, 0.3)) {
    anatomicalLeftScore -= 0.65;
    yawSignWeight += 0.65;
  }

  const leftSideBias = yawSignWeight > 0 ? clamp(anatomicalLeftScore / yawSignWeight, -1, 1) : 0;

  // Magnitude of yaw away from straight front/back
  const earForeshorten = hasBothEars
    ? clamp(Math.abs(lEar!.x - rEar!.x) / (headRadius * 1.65), 0, 1)
    : 0.35;
  const noseOffsetMag = clamp(Math.abs(noseShiftX), 0, 1);
  const lateralMag = clamp(Math.max(noseOffsetMag, 1 - earForeshorten * 0.85), 0, 1);

  const isPosteriorHead =
    bodyView === 'back' &&
    avgFaceVis < 0.38 &&
    (!isVis(nose, 0.35) || (ls && rs && nose && nose.z > (ls.z + rs.z) * 0.5));

  let cosHead = isPosteriorHead ? -Math.sqrt(Math.max(0, 1 - lateralMag * lateralMag * 0.7)) : Math.sqrt(Math.max(0, 1 - lateralMag * lateralMag));
  if (isPosteriorHead && lateralMag < 0.55) {
    cosHead = -1;
  }
  const sinHead =
    Math.abs(leftSideBias) > 0.08
      ? Math.sign(leftSideBias) * lateralMag
      : bodyView === 'left'
        ? lateralMag
        : bodyView === 'right'
          ? -lateralMag
          : -noseShiftX;

  let yawRad = Math.atan2(sinHead, cosHead);
  if (faceResult?.yawRad !== undefined && Number.isFinite(faceResult.yawRad)) {
    // Blend FaceLandmarker 3D yaw when available
    yawRad = faceResult.yawRad * 0.72 + yawRad * 0.28;
  }
  const yawDeg = (yawRad * 180) / Math.PI;

  let view: DetectedOrientation;
  if (Math.abs(yawDeg) <= 55) {
    view = 'front';
  } else if (Math.abs(yawDeg) >= 130) {
    view = 'back';
  } else {
    view = yawDeg >= 0 ? 'left' : 'right';
  }

  // If body is strictly back and head didn't turn past 55 deg from back
  if (isPosteriorHead && lateralMag < 0.72) {
    view = 'back';
    yawRad = bodyYawRad;
  }

  const facingSign =
    Math.abs(noseShiftX) > 0.1
      ? Math.sign(noseShiftX)
      : view === 'left'
        ? 1
        : view === 'right'
          ? -1
          : 1;

  return {
    yawRad,
    yawDeg: (yawRad * 180) / Math.PI,
    pitchRatio,
    view,
    facingSign,
    jawOpen
  };
}

/**
 * Automatic 4-way orientation detector (front, back, left, right) plus
 * independent head yaw & jaw tracking with EMA smoothing and hysteresis.
 */
export class OrientationDetector {
  private currentView: DetectedOrientation = 'front';
  private currentHeadView: DetectedOrientation = 'front';
  private smoothedScore = 0.5;
  private smoothedCosYaw = 0.8;
  private smoothedSinYaw = 0;
  private smoothedHeadYawRad = 0;
  private smoothedJawOpen = 0;
  private readonly alpha: number;
  private readonly hysteresisThreshold: number;
  private pendingView: DetectedOrientation | null = null;
  private pendingFrames = 0;
  private pendingHeadView: DetectedOrientation | null = null;
  private pendingHeadFrames = 0;
  private readonly requiredFrames: number;

  constructor(options?: {
    initialView?: DetectedOrientation;
    alpha?: number;
    hysteresisThreshold?: number;
    requiredFrames?: number;
  }) {
    this.currentView = options?.initialView ?? 'front';
    this.currentHeadView = this.currentView;
    this.smoothedScore = this.currentView === 'front' ? 0.5 : this.currentView === 'back' ? -0.5 : 0;
    this.smoothedCosYaw = this.currentView === 'front' ? 0.8 : this.currentView === 'back' ? -0.8 : 0;
    this.smoothedSinYaw = this.currentView === 'left' ? 0.8 : this.currentView === 'right' ? -0.8 : 0;
    this.alpha = options?.alpha ?? 0.28;
    this.hysteresisThreshold = Math.abs(options?.hysteresisThreshold ?? 0.25);
    this.requiredFrames = options?.requiredFrames ?? 4;
  }

  reset(view: DetectedOrientation = 'front'): void {
    this.currentView = view;
    this.currentHeadView = view;
    this.smoothedScore = view === 'front' ? 0.5 : view === 'back' ? -0.5 : 0;
    this.smoothedCosYaw = view === 'front' ? 0.8 : view === 'back' ? -0.8 : 0;
    this.smoothedSinYaw = view === 'left' ? 0.8 : view === 'right' ? -0.8 : 0;
    this.smoothedHeadYawRad =
      view === 'left' ? Math.PI * 0.5 : view === 'right' ? -Math.PI * 0.5 : view === 'back' ? Math.PI : 0;
    this.smoothedJawOpen = 0;
    this.pendingView = null;
    this.pendingFrames = 0;
    this.pendingHeadView = null;
    this.pendingHeadFrames = 0;
  }

  update(
    landmarks: readonly PoseLandmark[] | null,
    override: ViewModeOverride = 'auto',
    faceResult?: FaceTrackingResult | null
  ): OrientationResult {
    const defaultHead: HeadPoseEstimate = {
      yawRad:
        override === 'left'
          ? Math.PI * 0.5
          : override === 'right'
            ? -Math.PI * 0.5
            : override === 'back'
              ? Math.PI
              : 0,
      yawDeg:
        override === 'left'
          ? 90
          : override === 'right'
            ? -90
            : override === 'back'
              ? 180
              : 0,
      pitchRatio: 0,
      view: override === 'auto' ? this.currentHeadView : override,
      facingSign: override === 'right' ? -1 : 1,
      jawOpen: this.smoothedJawOpen
    };

    if (override !== 'auto') {
      this.currentView = override;
      this.currentHeadView = override;
      this.smoothedScore = override === 'front' ? 1 : override === 'back' ? -1 : 0;
      this.smoothedCosYaw = override === 'front' ? 1 : override === 'back' ? -1 : 0;
      this.smoothedSinYaw = override === 'left' ? 1 : override === 'right' ? -1 : 0;
      this.pendingView = null;
      this.pendingFrames = 0;

      if (landmarks && landmarks.length > 0) {
        const rawHead = computeHeadPose(landmarks, override, defaultHead.yawRad, faceResult);
        this.smoothedJawOpen = 0.45 * rawHead.jawOpen + 0.55 * this.smoothedJawOpen;
        return {
          view: override,
          rawScore: this.smoothedScore,
          smoothedScore: this.smoothedScore,
          bodyYawDeg: defaultHead.yawDeg,
          head: {
            ...rawHead,
            view: override,
            jawOpen: this.smoothedJawOpen
          }
        };
      }

      return {
        view: override,
        rawScore: this.smoothedScore,
        smoothedScore: this.smoothedScore,
        bodyYawDeg: defaultHead.yawDeg,
        head: defaultHead
      };
    }

    if (!landmarks || landmarks.length === 0) {
      return {
        view: this.currentView,
        rawScore: 0,
        smoothedScore: this.smoothedScore,
        bodyYawDeg: (Math.atan2(this.smoothedSinYaw, this.smoothedCosYaw) * 180) / Math.PI,
        head: {
          ...defaultHead,
          yawRad: this.smoothedHeadYawRad,
          yawDeg: (this.smoothedHeadYawRad * 180) / Math.PI,
          view: this.currentHeadView
        }
      };
    }

    const rawScore = computeOrientationScore(landmarks);
    const bodyEst = computeBodyYawAndSideScore(landmarks);

    this.smoothedScore = this.alpha * rawScore + (1 - this.alpha) * this.smoothedScore;
    this.smoothedCosYaw = this.alpha * bodyEst.cosYaw + (1 - this.alpha) * this.smoothedCosYaw;
    this.smoothedSinYaw = this.alpha * bodyEst.sinYaw + (1 - this.alpha) * this.smoothedSinYaw;

    const smoothedBodyYawRad = Math.atan2(this.smoothedSinYaw, this.smoothedCosYaw);
    const smoothedBodyYawDeg = (smoothedBodyYawRad * 180) / Math.PI;

    // Determine candidate 4-way body view with hysteresis
    let candidateView: DetectedOrientation = this.currentView;
    if (bodyEst.shRatio < 0.46 && Math.abs(this.smoothedSinYaw) > 0.42 && Math.abs(this.smoothedCosYaw) < 0.46) {
      candidateView = this.smoothedSinYaw >= 0 ? 'left' : 'right';
    } else if (this.currentView === 'front') {
      if (this.smoothedScore <= -this.hysteresisThreshold) {
        candidateView = 'back';
      }
    } else if (this.currentView === 'back') {
      if (this.smoothedScore >= this.hysteresisThreshold) {
        candidateView = 'front';
      }
    } else {
      // Currently in 'left' or 'right' side view
      if (bodyEst.shRatio >= 0.5 && Math.abs(this.smoothedScore) >= this.hysteresisThreshold) {
        candidateView = this.smoothedScore >= 0 ? 'front' : 'back';
      } else if (Math.abs(this.smoothedSinYaw) > 0.45) {
        candidateView = this.smoothedSinYaw >= 0 ? 'left' : 'right';
      }
    }

    if (candidateView !== this.currentView) {
      if (this.pendingView === candidateView) {
        this.pendingFrames++;
        if (this.pendingFrames >= this.requiredFrames) {
          this.currentView = candidateView;
          this.pendingView = null;
          this.pendingFrames = 0;
        }
      } else {
        this.pendingView = candidateView;
        this.pendingFrames = 1;
      }
    } else {
      this.pendingView = null;
      this.pendingFrames = 0;
    }

    // Independent head pose + jaw tracking
    const rawHead = computeHeadPose(landmarks, this.currentView, smoothedBodyYawRad, faceResult);
    // Smooth head yaw angle (handling wrap-around near +-PI)
    const dYaw = Math.atan2(
      Math.sin(rawHead.yawRad - this.smoothedHeadYawRad),
      Math.cos(rawHead.yawRad - this.smoothedHeadYawRad)
    );
    this.smoothedHeadYawRad += Math.min(0.45, this.alpha * 1.35) * dYaw;
    this.smoothedJawOpen = 0.45 * rawHead.jawOpen + 0.55 * this.smoothedJawOpen;

    const smoothedHeadYawDeg = (this.smoothedHeadYawRad * 180) / Math.PI;
    let candidateHeadView: DetectedOrientation = rawHead.view;
    if (Math.abs(smoothedHeadYawDeg) <= 52) {
      candidateHeadView = 'front';
    } else if (Math.abs(smoothedHeadYawDeg) >= 132) {
      candidateHeadView = 'back';
    } else {
      candidateHeadView = smoothedHeadYawDeg >= 0 ? 'left' : 'right';
    }

    if (candidateHeadView !== this.currentHeadView) {
      if (this.pendingHeadView === candidateHeadView) {
        this.pendingHeadFrames++;
        if (this.pendingHeadFrames >= Math.max(2, this.requiredFrames - 1)) {
          this.currentHeadView = candidateHeadView;
          this.pendingHeadView = null;
          this.pendingHeadFrames = 0;
        }
      } else {
        this.pendingHeadView = candidateHeadView;
        this.pendingHeadFrames = 1;
      }
    } else {
      this.pendingHeadView = null;
      this.pendingHeadFrames = 0;
    }

    return {
      view: this.currentView,
      rawScore,
      smoothedScore: this.smoothedScore,
      bodyYawDeg: smoothedBodyYawDeg,
      head: {
        ...rawHead,
        yawRad: this.smoothedHeadYawRad,
        yawDeg: smoothedHeadYawDeg,
        view: this.currentHeadView,
        jawOpen: this.smoothedJawOpen
      }
    };
  }
}
