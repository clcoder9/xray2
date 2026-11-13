import type { PoseLandmark } from './types';

export type DevSampleId =
  | 'anterior'
  | 'posterior'
  | 'lateral'
  | 'upper_body'
  | 'motion_loop';

export interface DevSampleMeta {
  id: DevSampleId;
  imageUrl?: string;
  labelEn: string;
  labelDe: string;
}

export const DEV_SAMPLES: readonly DevSampleMeta[] = [
  {
    id: 'anterior',
    imageUrl: './dev-samples/anterior-athlete.png',
    labelEn: 'Front Athlete (Full Body)',
    labelDe: 'Athlet Vorne (Ganzkörper)'
  },
  {
    id: 'posterior',
    imageUrl: './dev-samples/posterior-athlete.png',
    labelEn: 'Back Athlete (Full Body)',
    labelDe: 'Athlet Hinten (Ganzkörper)'
  },
  {
    id: 'lateral',
    labelEn: 'Side Athlete (Profile)',
    labelDe: 'Athlet Seite (Profil)'
  },
  {
    id: 'upper_body',
    imageUrl: './dev-samples/upper-body.png',
    labelEn: 'Partial Upper Body',
    labelDe: 'Teilkörper (Oberkörper)'
  },
  {
    id: 'motion_loop',
    labelEn: 'Simulated Motion Loop',
    labelDe: 'Simulierte Bewegung'
  }
];

function lm(x: number, y: number, z = 0, visibility = 0.98): PoseLandmark {
  return { x, y, z, visibility };
}

/**
 * Optional animated jaw opening [0..1] for synthetic motion_loop preview.
 */
export function getDevSampleJawOpen(sampleId: DevSampleId, timeMs = 0): number {
  if (sampleId !== 'motion_loop') return 0;
  const phase = (timeMs / 1000) * 1.4;
  return Math.max(0, Math.sin(phase * 1.3)) * 0.72;
}

/**
 * Generates anatomically proportioned 33-landmark pose matching the bundled
 * Dev Sample illustrations (720x1080 portrait canvas).
 */
export function getDevSampleLandmarks(
  sampleId: DevSampleId,
  timeMs = 0
): PoseLandmark[] {
  if (sampleId === 'lateral') {
    // Left-side profile facing viewer's right (+X):
    // anatomical LEFT side is near camera (z < 0, high vis), RIGHT side is far (z > 0, lower vis).
    const cx = 0.48;
    return [
      lm(cx + 0.062, 0.125, -0.02, 0.98), // 0 NOSE (facing +X)
      lm(cx + 0.044, 0.112, -0.05, 0.95), // 1 LEFT_EYE_INNER
      lm(cx + 0.038, 0.112, -0.06, 0.96), // 2 LEFT_EYE
      lm(cx + 0.032, 0.114, -0.07, 0.94), // 3 LEFT_EYE_OUTER
      lm(cx + 0.044, 0.112, 0.05, 0.25), // 4 RIGHT_EYE_INNER (occluded)
      lm(cx + 0.038, 0.112, 0.06, 0.22), // 5 RIGHT_EYE
      lm(cx + 0.032, 0.114, 0.07, 0.20), // 6 RIGHT_EYE_OUTER
      lm(cx - 0.015, 0.12, -0.09, 0.97), // 7 LEFT_EAR (near camera)
      lm(cx - 0.012, 0.12, 0.09, 0.18), // 8 RIGHT_EAR (occluded)
      lm(cx + 0.048, 0.148, -0.04, 0.96), // 9 MOUTH_LEFT
      lm(cx + 0.046, 0.148, 0.04, 0.30), // 10 MOUTH_RIGHT
      lm(cx - 0.005, 0.235, -0.14, 0.99), // 11 LEFT_SHOULDER (near)
      lm(cx + 0.015, 0.235, 0.14, 0.58), // 12 RIGHT_SHOULDER (far)
      lm(cx + 0.025, 0.372, -0.15, 0.98), // 13 LEFT_ELBOW
      lm(cx + 0.040, 0.372, 0.15, 0.52), // 14 RIGHT_ELBOW
      lm(cx + 0.065, 0.495, -0.15, 0.97), // 15 LEFT_WRIST
      lm(cx + 0.075, 0.495, 0.15, 0.48), // 16 RIGHT_WRIST
      lm(cx + 0.060, 0.552, -0.15, 0.93), // 17 LEFT_PINKY
      lm(cx + 0.070, 0.552, 0.15, 0.45), // 18 RIGHT_PINKY
      lm(cx + 0.080, 0.558, -0.15, 0.93), // 19 LEFT_INDEX
      lm(cx + 0.090, 0.558, 0.15, 0.45), // 20 RIGHT_INDEX
      lm(cx + 0.085, 0.534, -0.15, 0.93), // 21 LEFT_THUMB
      lm(cx + 0.092, 0.534, 0.15, 0.45), // 22 RIGHT_THUMB
      lm(cx - 0.010, 0.495, -0.11, 0.99), // 23 LEFT_HIP
      lm(cx + 0.008, 0.495, 0.11, 0.56), // 24 RIGHT_HIP
      lm(cx + 0.015, 0.695, -0.11, 0.98), // 25 LEFT_KNEE
      lm(cx + 0.032, 0.695, 0.11, 0.54), // 26 RIGHT_KNEE
      lm(cx - 0.010, 0.885, -0.11, 0.98), // 27 LEFT_ANKLE
      lm(cx + 0.012, 0.885, 0.11, 0.52), // 28 RIGHT_ANKLE
      lm(cx - 0.036, 0.915, -0.10, 0.95), // 29 LEFT_HEEL
      lm(cx - 0.014, 0.915, 0.10, 0.48), // 30 RIGHT_HEEL
      lm(cx + 0.075, 0.930, -0.12, 0.96), // 31 LEFT_FOOT_INDEX (pointing +X)
      lm(cx + 0.092, 0.930, 0.12, 0.48) // 32 RIGHT_FOOT_INDEX
    ];
  }

  const isBack = sampleId === 'posterior';
  const isUpperOnly = sampleId === 'upper_body';

  // Subtle breathing / squat-arm + head turn + jaw animation in motion_loop
  const phase = sampleId === 'motion_loop' ? (timeMs / 1000) * 1.4 : 0;
  const swayX = sampleId === 'motion_loop' ? Math.sin(phase * 0.7) * 0.025 : 0;
  const armWave = sampleId === 'motion_loop' ? Math.sin(phase * 1.1) * 0.045 : 0;
  const kneeBend = sampleId === 'motion_loop' ? (Math.sin(phase) * 0.5 + 0.5) * 0.035 : 0;
  const headYawShift = sampleId === 'motion_loop' ? Math.sin(phase * 0.55) * 0.032 : 0;
  const jawOpen = getDevSampleJawOpen(sampleId, timeMs);
  const mouthDrop = jawOpen * 0.012;

  // In raw camera coordinates:
  // Front view: anatomical RIGHT is viewer LEFT (x < 0.5), anatomical LEFT is viewer RIGHT (x > 0.5).
  // Back view: anatomical LEFT is viewer LEFT (x < 0.5), anatomical RIGHT is viewer RIGHT (x > 0.5).
  const s = isBack ? -1 : 1;
  const cx = 0.5 + swayX;

  const faceVis = isBack ? 0.12 : 0.98;
  const noseZ = isBack ? 0.15 : -0.18;
  const lowerVis = isUpperOnly ? 0.08 : 0.98;
  const yScale = isUpperOnly ? 1.45 : 1.0;
  const yOffset = isUpperOnly ? 0.06 : 0.0;

  const mapY = (y: number) => yOffset + y * yScale;

  // 33 landmarks ordered strictly by MP_LANDMARK indices 0..32
  return [
    lm(cx + headYawShift, mapY(0.125), noseZ, faceVis), // 0 NOSE
    lm(cx + headYawShift * 0.8 + s * 0.015, mapY(0.112), noseZ, faceVis), // 1 LEFT_EYE_INNER
    lm(cx + headYawShift * 0.8 + s * 0.024, mapY(0.112), noseZ, faceVis), // 2 LEFT_EYE
    lm(cx + headYawShift * 0.8 + s * 0.033, mapY(0.114), noseZ, faceVis), // 3 LEFT_EYE_OUTER
    lm(cx + headYawShift * 0.8 - s * 0.015, mapY(0.112), noseZ, faceVis), // 4 RIGHT_EYE_INNER
    lm(cx + headYawShift * 0.8 - s * 0.024, mapY(0.112), noseZ, faceVis), // 5 RIGHT_EYE
    lm(cx + headYawShift * 0.8 - s * 0.033, mapY(0.114), noseZ, faceVis), // 6 RIGHT_EYE_OUTER
    lm(cx - headYawShift * 0.25 + s * 0.052, mapY(0.12), -headYawShift * 1.2, 0.94), // 7 LEFT_EAR
    lm(cx - headYawShift * 0.25 - s * 0.052, mapY(0.12), headYawShift * 1.2, 0.94), // 8 RIGHT_EAR
    lm(cx + headYawShift * 0.9 + s * (0.016 - jawOpen * 0.003), mapY(0.145 + mouthDrop), noseZ, faceVis), // 9 MOUTH_LEFT
    lm(cx + headYawShift * 0.9 - s * (0.016 - jawOpen * 0.003), mapY(0.145 + mouthDrop), noseZ, faceVis), // 10 MOUTH_RIGHT
    lm(cx + s * 0.145, mapY(0.235), 0, 0.99), // 11 LEFT_SHOULDER
    lm(cx - s * 0.145, mapY(0.235), 0, 0.99), // 12 RIGHT_SHOULDER
    lm(cx + s * 0.195, mapY(0.37 - armWave * 0.5), 0, 0.98), // 13 LEFT_ELBOW
    lm(cx - s * 0.195, mapY(0.37 - armWave * 0.5), 0, 0.98), // 14 RIGHT_ELBOW
    lm(cx + s * 0.235, mapY(0.5 - armWave), -0.05, 0.97), // 15 LEFT_WRIST
    lm(cx - s * 0.235, mapY(0.5 - armWave), -0.05, 0.97), // 16 RIGHT_WRIST
    lm(cx + s * 0.255, mapY(0.555 - armWave), -0.05, 0.93), // 17 LEFT_PINKY
    lm(cx - s * 0.255, mapY(0.555 - armWave), -0.05, 0.93), // 18 RIGHT_PINKY
    lm(cx + s * 0.238, mapY(0.565 - armWave), -0.05, 0.93), // 19 LEFT_INDEX
    lm(cx - s * 0.238, mapY(0.565 - armWave), -0.05, 0.93), // 20 RIGHT_INDEX
    lm(cx + s * 0.22, mapY(0.54 - armWave), -0.05, 0.93), // 21 LEFT_THUMB
    lm(cx - s * 0.22, mapY(0.54 - armWave), -0.05, 0.93), // 22 RIGHT_THUMB
    lm(cx + s * 0.095, mapY(0.495 + kneeBend * 0.4), 0, isUpperOnly ? 0.15 : 0.99), // 23 LEFT_HIP
    lm(cx - s * 0.095, mapY(0.495 + kneeBend * 0.4), 0, isUpperOnly ? 0.15 : 0.99), // 24 RIGHT_HIP
    lm(cx + s * 0.115, mapY(0.695 + kneeBend), -0.04, lowerVis), // 25 LEFT_KNEE
    lm(cx - s * 0.115, mapY(0.695 + kneeBend), -0.04, lowerVis), // 26 RIGHT_KNEE
    lm(cx + s * 0.125, mapY(0.885), 0.02, lowerVis), // 27 LEFT_ANKLE
    lm(cx - s * 0.125, mapY(0.885), 0.02, lowerVis), // 28 RIGHT_ANKLE
    lm(cx + s * 0.12, mapY(0.915), 0.04, lowerVis), // 29 LEFT_HEEL
    lm(cx - s * 0.12, mapY(0.915), 0.04, lowerVis), // 30 RIGHT_HEEL
    lm(cx + s * 0.145, mapY(0.935), -0.06, lowerVis), // 31 LEFT_FOOT_INDEX
    lm(cx - s * 0.145, mapY(0.935), -0.06, lowerVis) // 32 RIGHT_FOOT_INDEX
  ];
}
