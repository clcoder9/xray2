import {
  MP_LANDMARK,
  type DetectedOrientation,
  type PoseLandmark,
  type ViewModeOverride
} from './types';

export interface OrientationResult {
  view: DetectedOrientation;
  rawScore: number; // [-1, 1] where +1 = strongly front, -1 = strongly back
  smoothedScore: number;
}

/**
 * Computes raw front/back evidence score in [-1, +1] from unmirrored
 * normalized pose landmarks.
 *
 * In raw unmirrored camera image coordinates (x increases left-to-right):
 * - When facing the camera (anterior view), anatomical RIGHT shoulder (12) is
 *   on the viewer's LEFT (smaller x) and anatomical LEFT shoulder (11) is on the
 *   viewer's RIGHT (larger x), so (leftShoulder.x - rightShoulder.x) > 0.
 * - When facing away (posterior view), anatomical LEFT shoulder (11) is on the
 *   viewer's LEFT (smaller x) and anatomical RIGHT shoulder (12) is on the
 *   viewer's RIGHT (larger x), so (leftShoulder.x - rightShoulder.x) < 0.
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

  let score = 0;
  let totalWeight = 0;

  // 1. Shoulder horizontal ordering (strongest cue)
  if (ls && rs && (ls.visibility ?? 1) >= 0.35 && (rs.visibility ?? 1) >= 0.35) {
    const dx = ls.x - rs.x;
    const shoulderSpan = Math.max(0.06, Math.abs(dx) + Math.abs(ls.y - rs.y) * 0.25);
    const normalizedDx = Math.max(-1, Math.min(1, dx / shoulderSpan));
    score += normalizedDx * 0.55;
    totalWeight += 0.55;
  }

  // 2. Hip horizontal ordering (reinforces shoulder cue)
  if (lh && rh && (lh.visibility ?? 1) >= 0.35 && (rh.visibility ?? 1) >= 0.35) {
    const dx = lh.x - rh.x;
    const hipSpan = Math.max(0.04, Math.abs(dx) + Math.abs(lh.y - rh.y) * 0.25);
    const normalizedDx = Math.max(-1, Math.min(1, dx / hipSpan));
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
    score += Math.max(-1, Math.min(1, faceSignal)) * 0.2;
    totalWeight += 0.2;
  }

  if (totalWeight === 0) return 0;
  return Math.max(-1, Math.min(1, score / totalWeight));
}

/**
 * Automatic front/back detector with hysteresis and exponential smoothing
 * to prevent flickering when a person turns obliquely.
 */
export class OrientationDetector {
  private currentView: DetectedOrientation = 'front';
  private smoothedScore = 0.5;
  private readonly alpha: number;
  private readonly toBackThreshold: number;
  private readonly toFrontThreshold: number;
  private pendingFrames = 0;
  private readonly requiredFrames: number;

  constructor(options?: {
    initialView?: DetectedOrientation;
    alpha?: number;
    hysteresisThreshold?: number;
    requiredFrames?: number;
  }) {
    this.currentView = options?.initialView ?? 'front';
    this.smoothedScore = this.currentView === 'front' ? 0.5 : -0.5;
    this.alpha = options?.alpha ?? 0.28;
    const thresh = options?.hysteresisThreshold ?? 0.25;
    this.toBackThreshold = -Math.abs(thresh);
    this.toFrontThreshold = Math.abs(thresh);
    this.requiredFrames = options?.requiredFrames ?? 4;
  }

  reset(view: DetectedOrientation = 'front'): void {
    this.currentView = view;
    this.smoothedScore = view === 'front' ? 0.5 : -0.5;
    this.pendingFrames = 0;
  }

  update(
    landmarks: readonly PoseLandmark[] | null,
    override: ViewModeOverride = 'auto'
  ): OrientationResult {
    if (override === 'front' || override === 'back') {
      this.currentView = override;
      this.smoothedScore = override === 'front' ? 1 : -1;
      this.pendingFrames = 0;
      return {
        view: override,
        rawScore: this.smoothedScore,
        smoothedScore: this.smoothedScore
      };
    }

    if (!landmarks || landmarks.length === 0) {
      return {
        view: this.currentView,
        rawScore: 0,
        smoothedScore: this.smoothedScore
      };
    }

    const rawScore = computeOrientationScore(landmarks);
    this.smoothedScore =
      this.alpha * rawScore + (1 - this.alpha) * this.smoothedScore;

    if (this.currentView === 'front') {
      if (this.smoothedScore <= this.toBackThreshold) {
        this.pendingFrames++;
        if (this.pendingFrames >= this.requiredFrames) {
          this.currentView = 'back';
          this.pendingFrames = 0;
        }
      } else {
        this.pendingFrames = 0;
      }
    } else {
      if (this.smoothedScore >= this.toFrontThreshold) {
        this.pendingFrames++;
        if (this.pendingFrames >= this.requiredFrames) {
          this.currentView = 'front';
          this.pendingFrames = 0;
        }
      } else {
        this.pendingFrames = 0;
      }
    }

    return {
      view: this.currentView,
      rawScore,
      smoothedScore: this.smoothedScore
    };
  }
}
