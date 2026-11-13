import { MP_LANDMARK, type PoseLandmark } from './types';

function scorePose(landmarks: readonly PoseLandmark[]): number {
  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  let confidentCount = 0;

  for (const lm of landmarks) {
    const vis = lm.visibility ?? 1;
    if (vis < 0.35) continue;
    confidentCount++;
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }

  if (confidentCount < 4) return 0;

  const width = Math.max(0.02, maxX - minX);
  const height = Math.max(0.02, maxY - minY);
  const area = width * height;

  // Prefer torso center if confident; otherwise bounding box center
  const ls = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rs = landmarks[MP_LANDMARK.RIGHT_SHOULDER];
  const lh = landmarks[MP_LANDMARK.LEFT_HIP];
  const rh = landmarks[MP_LANDMARK.RIGHT_HIP];

  let cx = (minX + maxX) * 0.5;
  let cy = (minY + maxY) * 0.5;
  if (ls && rs && (ls.visibility ?? 1) >= 0.4 && (rs.visibility ?? 1) >= 0.4) {
    if (lh && rh && (lh.visibility ?? 1) >= 0.4 && (rh.visibility ?? 1) >= 0.4) {
      cx = (ls.x + rs.x + lh.x + rh.x) * 0.25;
      cy = (ls.y + rs.y + lh.y + rh.y) * 0.25;
    } else {
      cx = (ls.x + rs.x) * 0.5;
      cy = (ls.y + rs.y) * 0.5;
    }
  }

  const distFromCenter = Math.hypot(cx - 0.5, cy - 0.5);
  // Centrality multiplier ranges from 1.0 (center) down to ~0.25 (corner)
  const centralityWeight = Math.max(0.25, 1.0 - distFromCenter * 1.15);

  return area * centralityWeight;
}

/**
 * When multiple people are visible in the frame, selects the largest,
 * most central person. Returns null if no valid person is present.
 */
export function selectPrimaryPerson(
  poses: readonly (readonly PoseLandmark[])[]
): PoseLandmark[] | null {
  if (!poses || poses.length === 0) return null;
  if (poses.length === 1) {
    return scorePose(poses[0]) > 0 ? poses[0].map((lm) => ({ ...lm })) : null;
  }

  let bestPose: readonly PoseLandmark[] | null = null;
  let bestScore = 0;

  for (const pose of poses) {
    const score = scorePose(pose);
    if (score > bestScore) {
      bestScore = score;
      bestPose = pose;
    }
  }

  return bestPose ? bestPose.map((lm) => ({ ...lm })) : null;
}
