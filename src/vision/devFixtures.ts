import type { PoseLandmark } from './types';

export type DevSampleId = 'anterior' | 'posterior' | 'upper_body' | 'motion_loop';

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
 * Generates anatomically proportioned 33-landmark pose matching the bundled
 * Dev Sample illustrations (720x1080 portrait canvas).
 */
export function getDevSampleLandmarks(
  sampleId: DevSampleId,
  timeMs = 0
): PoseLandmark[] {
  const isBack = sampleId === 'posterior';
  const isUpperOnly = sampleId === 'upper_body';

  // Subtle breathing / squat-arm animation in motion_loop
  const phase = sampleId === 'motion_loop' ? (timeMs / 1000) * 1.4 : 0;
  const swayX = sampleId === 'motion_loop' ? Math.sin(phase * 0.7) * 0.025 : 0;
  const armWave = sampleId === 'motion_loop' ? Math.sin(phase * 1.1) * 0.045 : 0;
  const kneeBend = sampleId === 'motion_loop' ? (Math.sin(phase) * 0.5 + 0.5) * 0.035 : 0;

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
    lm(cx, mapY(0.125), noseZ, faceVis), // 0 NOSE
    lm(cx + s * 0.015, mapY(0.112), noseZ, faceVis), // 1 LEFT_EYE_INNER
    lm(cx + s * 0.024, mapY(0.112), noseZ, faceVis), // 2 LEFT_EYE
    lm(cx + s * 0.033, mapY(0.114), noseZ, faceVis), // 3 LEFT_EYE_OUTER
    lm(cx - s * 0.015, mapY(0.112), noseZ, faceVis), // 4 RIGHT_EYE_INNER
    lm(cx - s * 0.024, mapY(0.112), noseZ, faceVis), // 5 RIGHT_EYE
    lm(cx - s * 0.033, mapY(0.114), noseZ, faceVis), // 6 RIGHT_EYE_OUTER
    lm(cx + s * 0.052, mapY(0.12), 0, 0.94), // 7 LEFT_EAR
    lm(cx - s * 0.052, mapY(0.12), 0, 0.94), // 8 RIGHT_EAR
    lm(cx + s * 0.016, mapY(0.145), noseZ, faceVis), // 9 MOUTH_LEFT
    lm(cx - s * 0.016, mapY(0.145), noseZ, faceVis), // 10 MOUTH_RIGHT
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
