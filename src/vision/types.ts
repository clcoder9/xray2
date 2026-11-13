export interface PoseLandmark {
  x: number; // normalized [0..1]
  y: number; // normalized [0..1]
  z: number;
  visibility?: number;
}

export type ViewModeOverride = 'auto' | 'front' | 'back' | 'left' | 'right';
export type DetectedOrientation = 'front' | 'back' | 'left' | 'right';
export type AnatomicalSide = 'left' | 'right' | 'midline';

export interface HeadPoseEstimate {
  /** Head yaw in radians [-PI, PI]: 0 = front, +PI/2 = anatomical left toward camera, -PI/2 = anatomical right toward camera, +-PI = back */
  yawRad: number;
  yawDeg: number;
  pitchRatio: number; // [-1, 1]
  view: DetectedOrientation;
  /** +1 if nose/anterior face points toward +X in screen space (or +axisU), -1 toward -X */
  facingSign: number;
  /** Real-time jaw opening ratio in [0..1] */
  jawOpen: number;
}

export interface FaceTrackingResult {
  jawOpen: number; // [0..1]
  yawRad?: number;
  pitchRad?: number;
  rollRad?: number;
  chinPoint?: { x: number; y: number }; // normalized [0..1]
}

/** Standard MediaPipe 33 Pose Landmark indices */
export const MP_LANDMARK = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
} as const;
