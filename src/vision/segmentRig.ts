import { ANATOMY_ARTWORK_REGISTRY, type PointUV } from '../assets/anatomyRegistry';
import {
  ANATOMY_STRUCTURES,
  type AnatomyStructure,
  type BodySegment,
  type StructureType
} from '../data/anatomyData';
import {
  MP_LANDMARK,
  type AnatomicalSide,
  type DetectedOrientation,
  type PoseLandmark
} from './types';

export interface FrameViewport {
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface SegmentBox {
  key: string; // e.g., 'torso', 'upper_arm:left', 'thigh:right'
  segment: BodySegment;
  side: AnatomicalSide;
  origin: ScreenPoint; // v = 0 center
  axisV: ScreenPoint; // unit vector proximal -> distal
  axisU: ScreenPoint; // unit vector pointing laterally (positive u)
  length: number; // pixel length from v = 0 to v = 1
  halfWidth: number; // pixel half-width corresponding to u = 1
  confident: boolean;
}

export interface RenderedStructureInstance {
  instanceId: string; // e.g., 'm_biceps_caput_longum:left' or 'b_sternum:midline'
  structure: AnatomyStructure;
  side: AnatomicalSide;
  segmentKey: string;
  anchor: ScreenPoint;
  contours: ScreenPoint[][];
  cutouts: ScreenPoint[][];
  trabecularZones: ScreenPoint[][];
  cartilageZones: ScreenPoint[][];
  detailPaths: ScreenPoint[][];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  fiberScreenAngleRad: number;
  proximalPt: ScreenPoint;
  distalPt: ScreenPoint;
  axisU: ScreenPoint;
  axisV: ScreenPoint;
  halfWidth: number;
  length: number;
}

const MIN_CONFIDENCE = 0.45;

export function computeFrameViewport(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  fit: 'cover' | 'contain'
): FrameViewport {
  if (srcWidth <= 0 || srcHeight <= 0 || dstWidth <= 0 || dstHeight <= 0) {
    return { offsetX: 0, offsetY: 0, drawWidth: dstWidth, drawHeight: dstHeight };
  }
  const srcAspect = srcWidth / srcHeight;
  const dstAspect = dstWidth / dstHeight;

  let drawWidth = dstWidth;
  let drawHeight = dstHeight;

  if (fit === 'cover') {
    if (srcAspect > dstAspect) {
      drawHeight = dstHeight;
      drawWidth = dstHeight * srcAspect;
    } else {
      drawWidth = dstWidth;
      drawHeight = dstWidth / srcAspect;
    }
  } else {
    if (srcAspect > dstAspect) {
      drawWidth = dstWidth;
      drawHeight = dstWidth / srcAspect;
    } else {
      drawHeight = dstHeight;
      drawWidth = dstHeight * srcAspect;
    }
  }

  return {
    offsetX: (dstWidth - drawWidth) * 0.5,
    offsetY: (dstHeight - drawHeight) * 0.5,
    drawWidth,
    drawHeight
  };
}

function toScreen(
  lm: PoseLandmark,
  vp: FrameViewport,
  mirrored: boolean
): ScreenPoint {
  const nx = mirrored ? 1 - lm.x : lm.x;
  return {
    x: vp.offsetX + nx * vp.drawWidth,
    y: vp.offsetY + lm.y * vp.drawHeight
  };
}

function visOf(lm: PoseLandmark | undefined): number {
  return lm?.visibility ?? 0;
}

function isConfident(...lms: (PoseLandmark | undefined)[]): boolean {
  return lms.every((lm) => lm !== undefined && visOf(lm) >= MIN_CONFIDENCE);
}

function mid(a: ScreenPoint, b: ScreenPoint): ScreenPoint {
  return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
}

function lerpPt(a: ScreenPoint, b: ScreenPoint, t: number): ScreenPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function dist(a: ScreenPoint, b: ScreenPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizeVec(dx: number, dy: number): ScreenPoint {
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return { x: 0, y: 1 };
  return { x: dx / len, y: dy / len };
}

function makeSegmentFromEndpoints(
  key: string,
  segment: BodySegment,
  side: AnatomicalSide,
  proximal: ScreenPoint,
  distal: ScreenPoint,
  halfWidth: number,
  bodyLeftPointsPositiveX: boolean,
  confident: boolean,
  explicitAxisU?: ScreenPoint
): SegmentBox {
  const length = Math.max(8, dist(proximal, distal));
  const axisV = normalizeVec(distal.x - proximal.x, distal.y - proximal.y);

  let axisU: ScreenPoint;
  if (explicitAxisU) {
    axisU = explicitAxisU;
  } else {
    // Outward lateral unit normal for bilateral limb
    const isLeftOnRightSide = bodyLeftPointsPositiveX;
    if (side === 'left') {
      axisU = isLeftOnRightSide
        ? { x: axisV.y, y: -axisV.x }
        : { x: -axisV.y, y: axisV.x };
    } else if (side === 'right') {
      axisU = isLeftOnRightSide
        ? { x: -axisV.y, y: axisV.x }
        : { x: axisV.y, y: -axisV.x };
    } else {
      axisU = isLeftOnRightSide
        ? { x: axisV.y, y: -axisV.x }
        : { x: -axisV.y, y: axisV.x };
    }
  }

  return {
    key,
    segment,
    side,
    origin: proximal,
    axisV,
    axisU,
    length,
    halfWidth: Math.max(6, halfWidth),
    confident
  };
}

/**
 * Builds the 10-segment anatomical rig (16 segment boxes including bilateral limbs)
 * from the 33 MediaPipe landmarks, computing synthetic neck/clavicle/pelvic anchors
 * and filtering out unconfident segments for partial bodies.
 */
export function buildSegmentRig(
  landmarks: readonly PoseLandmark[],
  vp: FrameViewport,
  mirrored: boolean
): Map<string, SegmentBox> {
  const boxes = new Map<string, SegmentBox>();

  const lsLm = landmarks[MP_LANDMARK.LEFT_SHOULDER];
  const rsLm = landmarks[MP_LANDMARK.RIGHT_SHOULDER];
  const lhLm = landmarks[MP_LANDMARK.LEFT_HIP];
  const rhLm = landmarks[MP_LANDMARK.RIGHT_HIP];
  const noseLm = landmarks[MP_LANDMARK.NOSE];
  const leEarLm = landmarks[MP_LANDMARK.LEFT_EAR];
  const reEarLm = landmarks[MP_LANDMARK.RIGHT_EAR];
  const leEyeLm = landmarks[MP_LANDMARK.LEFT_EYE];
  const reEyeLm = landmarks[MP_LANDMARK.RIGHT_EYE];
  const mlLm = landmarks[MP_LANDMARK.MOUTH_LEFT];
  const mrLm = landmarks[MP_LANDMARK.MOUTH_RIGHT];

  const ls = lsLm ? toScreen(lsLm, vp, mirrored) : { x: 0, y: 0 };
  const rs = rsLm ? toScreen(rsLm, vp, mirrored) : { x: 0, y: 0 };
  const lh = lhLm ? toScreen(lhLm, vp, mirrored) : { x: 0, y: 0 };
  const rh = rhLm ? toScreen(rhLm, vp, mirrored) : { x: 0, y: 0 };

  const shouldersConf = isConfident(lsLm, rsLm);
  const hipsConf = isConfident(lhLm, rhLm);

  const shoulderMid = mid(ls, rs);
  const hipMid = mid(lh, rh);
  const shoulderSpan = shouldersConf ? dist(ls, rs) : 120;
  const hipSpan = hipsConf ? dist(lh, rh) : shoulderSpan * 0.72;

  // Determine whether anatomical left is currently toward +X in screen space
  let bodyLeftPointsPositiveX = !mirrored;
  if (shouldersConf && Math.abs(ls.x - rs.x) > 4) {
    bodyLeftPointsPositiveX = ls.x > rs.x;
  } else if (hipsConf && Math.abs(lh.x - rh.x) > 4) {
    bodyLeftPointsPositiveX = lh.x > rh.x;
  }

  // Torso axis vectors
  const torsoAxisU = shouldersConf
    ? normalizeVec(ls.x - rs.x, ls.y - rs.y)
    : { x: bodyLeftPointsPositiveX ? 1 : -1, y: 0 };

  // 1. Torso segment (shoulderMid -> hipMid)
  if (shouldersConf && hipsConf) {
    const torsoTop = {
      x: shoulderMid.x - (hipMid.x - shoulderMid.x) * 0.06,
      y: shoulderMid.y - (hipMid.y - shoulderMid.y) * 0.06
    };
    const torsoBottom = lerpPt(shoulderMid, hipMid, 0.92);
    boxes.set(
      'torso',
      makeSegmentFromEndpoints(
        'torso',
        'torso',
        'midline',
        torsoTop,
        torsoBottom,
        shoulderSpan * 0.56,
        bodyLeftPointsPositiveX,
        true,
        torsoAxisU
      )
    );
  } else if (shouldersConf) {
    // Upper-body partial frame fallback: infer torso extent from shoulder width
    const estHeight = shoulderSpan * 1.48;
    const perpDown = bodyLeftPointsPositiveX
      ? { x: -torsoAxisU.y, y: torsoAxisU.x }
      : { x: torsoAxisU.y, y: -torsoAxisU.x };
    const torsoTop = {
      x: shoulderMid.x - perpDown.x * estHeight * 0.05,
      y: shoulderMid.y - perpDown.y * estHeight * 0.05
    };
    const torsoBottom = {
      x: shoulderMid.x + perpDown.x * estHeight * 0.92,
      y: shoulderMid.y + perpDown.y * estHeight * 0.92
    };
    boxes.set(
      'torso',
      makeSegmentFromEndpoints(
        'torso',
        'torso',
        'midline',
        torsoTop,
        torsoBottom,
        shoulderSpan * 0.56,
        bodyLeftPointsPositiveX,
        true,
        torsoAxisU
      )
    );
  }

  // 2. Pelvis segment (slightly above hipMid -> trochanter/pubic base)
  if (hipsConf) {
    const pelvisAxisU = normalizeVec(lh.x - rh.x, lh.y - rh.y);
    const torsoRefLen = shouldersConf ? dist(shoulderMid, hipMid) : hipSpan * 1.9;
    const downDir = shouldersConf
      ? normalizeVec(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y)
      : { x: 0, y: 1 };
    const pelvisTop = {
      x: hipMid.x - downDir.x * torsoRefLen * 0.17,
      y: hipMid.y - downDir.y * torsoRefLen * 0.17
    };
    const pelvisBottom = {
      x: hipMid.x + downDir.x * torsoRefLen * 0.2,
      y: hipMid.y + downDir.y * torsoRefLen * 0.2
    };
    boxes.set(
      'pelvis',
      makeSegmentFromEndpoints(
        'pelvis',
        'pelvis',
        'midline',
        pelvisTop,
        pelvisBottom,
        Math.max(hipSpan * 0.72, shoulderSpan * 0.48),
        bodyLeftPointsPositiveX,
        true,
        pelvisAxisU
      )
    );
  }

  // 3. Head & Neck segments
  const headConf =
    isConfident(noseLm) ||
    isConfident(leEarLm, reEarLm) ||
    isConfident(leEyeLm, reEyeLm);
  if (headConf) {
    const earsConf = isConfident(leEarLm, reEarLm);
    const eyesConf = isConfident(leEyeLm, reEyeLm);
    const mouthConf = isConfident(mlLm, mrLm);

    const leEarPt = leEarLm ? toScreen(leEarLm, vp, mirrored) : null;
    const reEarPt = reEarLm ? toScreen(reEarLm, vp, mirrored) : null;
    const leEyePt = leEyeLm ? toScreen(leEyeLm, vp, mirrored) : null;
    const reEyePt = reEyeLm ? toScreen(reEyeLm, vp, mirrored) : null;
    const mlPt = mlLm ? toScreen(mlLm, vp, mirrored) : null;
    const mrPt = mrLm ? toScreen(mrLm, vp, mirrored) : null;
    const nosePt = noseLm ? toScreen(noseLm, vp, mirrored) : null;

    const earMid = earsConf && leEarPt && reEarPt ? mid(leEarPt, reEarPt) : null;
    const eyeMid = eyesConf && leEyePt && reEyePt ? mid(leEyePt, reEyePt) : null;
    const mouthMid = mouthConf && mlPt && mrPt ? mid(mlPt, mrPt) : null;

    const headRefCenter =
      nosePt && earMid
        ? mid(nosePt, earMid)
        : eyeMid ?? nosePt ?? earMid ?? shoulderMid;

    // Multi-cue cranial width so slight head turns never collapse horizontal scale
    const earWidthEst =
      earsConf && leEarPt && reEarPt ? dist(leEarPt, reEarPt) * 1.24 : 0;
    const eyeWidthEst =
      eyesConf && leEyePt && reEyePt ? dist(leEyePt, reEyePt) * 2.55 : 0;
    const mouthWidthEst =
      mouthConf && mlPt && mrPt ? dist(mlPt, mrPt) * 2.85 : 0;
    const shoulderHeadWidthFloor = shouldersConf ? shoulderSpan * 0.44 : 0;

    const cranialWidth = Math.max(
      earWidthEst,
      eyeWidthEst,
      mouthWidthEst,
      shoulderHeadWidthFloor,
      34
    );

    const shoulderHeadAxis = shouldersConf
      ? normalizeVec(
          headRefCenter.x - shoulderMid.x,
          headRefCenter.y - shoulderMid.y
        )
      : { x: 0, y: -1 };
    const faceUpAxis =
      eyeMid && mouthMid
        ? normalizeVec(eyeMid.x - mouthMid.x, eyeMid.y - mouthMid.y)
        : shoulderHeadAxis;
    const upDir =
      eyeMid && mouthMid && shouldersConf
        ? normalizeVec(
            faceUpAxis.x * 0.75 + shoulderHeadAxis.x * 0.25,
            faceUpAxis.y * 0.75 + shoulderHeadAxis.y * 0.25
          )
        : faceUpAxis;

    const eyeMouthHeightEst =
      eyeMid && mouthMid ? dist(eyeMid, mouthMid) * 3.15 : 0;
    const shoulderHeadHeightEst = shouldersConf
      ? dist(headRefCenter, shoulderMid) * 0.94
      : 0;
    const headHeight = Math.max(
      cranialWidth * 1.22,
      eyeMouthHeightEst,
      shoulderHeadHeightEst,
      42
    );

    // Face midpoint (v = 0.50) places eyes at ~0.44, nose at ~0.56, mouth at ~0.74
    const faceAnchor =
      eyeMid && mouthMid ? lerpPt(eyeMid, mouthMid, 0.2) : headRefCenter;

    const headTop = {
      x: faceAnchor.x + upDir.x * headHeight * 0.5,
      y: faceAnchor.y + upDir.y * headHeight * 0.5
    };
    const chinPt = {
      x: faceAnchor.x - upDir.x * headHeight * 0.5,
      y: faceAnchor.y - upDir.y * headHeight * 0.5
    };

    const headAxisU =
      earsConf && leEarPt && reEarPt
        ? normalizeVec(leEarPt.x - reEarPt.x, leEarPt.y - reEarPt.y)
        : eyesConf && leEyePt && reEyePt
          ? normalizeVec(leEyePt.x - reEyePt.x, leEyePt.y - reEyePt.y)
          : torsoAxisU;

    boxes.set(
      'head',
      makeSegmentFromEndpoints(
        'head',
        'head',
        'midline',
        headTop,
        chinPt,
        cranialWidth * 0.52,
        bodyLeftPointsPositiveX,
        true,
        headAxisU
      )
    );

    if (shouldersConf) {
      const neckTop = lerpPt(headTop, chinPt, 0.82);
      const neckBottom = lerpPt(shoulderMid, hipMid, hipsConf ? 0.05 : 0.0);
      boxes.set(
        'neck',
        makeSegmentFromEndpoints(
          'neck',
          'neck',
          'midline',
          neckTop,
          neckBottom,
          Math.max(cranialWidth * 0.36, shoulderSpan * 0.19),
          bodyLeftPointsPositiveX,
          true,
          torsoAxisU
        )
      );
    }
  }

  // 4. Upper Arms, Forearms, Hands
  const armSides: readonly {
    side: 'left' | 'right';
    sh: number;
    el: number;
    wr: number;
    pk: number;
    ix: number;
  }[] = [
    {
      side: 'left',
      sh: MP_LANDMARK.LEFT_SHOULDER,
      el: MP_LANDMARK.LEFT_ELBOW,
      wr: MP_LANDMARK.LEFT_WRIST,
      pk: MP_LANDMARK.LEFT_PINKY,
      ix: MP_LANDMARK.LEFT_INDEX
    },
    {
      side: 'right',
      sh: MP_LANDMARK.RIGHT_SHOULDER,
      el: MP_LANDMARK.RIGHT_ELBOW,
      wr: MP_LANDMARK.RIGHT_WRIST,
      pk: MP_LANDMARK.RIGHT_PINKY,
      ix: MP_LANDMARK.RIGHT_INDEX
    }
  ];

  for (const cfg of armSides) {
    const shLm = landmarks[cfg.sh];
    const elLm = landmarks[cfg.el];
    const wrLm = landmarks[cfg.wr];
    const pkLm = landmarks[cfg.pk];
    const ixLm = landmarks[cfg.ix];

    if (isConfident(shLm, elLm)) {
      const pSh = toScreen(shLm!, vp, mirrored);
      const pEl = toScreen(elLm!, vp, mirrored);
      const upperLen = dist(pSh, pEl);
      boxes.set(
        `upper_arm:${cfg.side}`,
        makeSegmentFromEndpoints(
          `upper_arm:${cfg.side}`,
          'upper_arm',
          cfg.side,
          pSh,
          pEl,
          Math.max(upperLen * 0.22, shoulderSpan * 0.14),
          bodyLeftPointsPositiveX,
          true
        )
      );

      if (isConfident(wrLm)) {
        const pWr = toScreen(wrLm!, vp, mirrored);
        const foreLen = dist(pEl, pWr);
        boxes.set(
          `forearm:${cfg.side}`,
          makeSegmentFromEndpoints(
            `forearm:${cfg.side}`,
            'forearm',
            cfg.side,
            pEl,
            pWr,
            Math.max(foreLen * 0.2, shoulderSpan * 0.115),
            bodyLeftPointsPositiveX,
            true
          )
        );

        const handTip = isConfident(pkLm, ixLm)
          ? mid(toScreen(pkLm!, vp, mirrored), toScreen(ixLm!, vp, mirrored))
          : isConfident(ixLm)
            ? toScreen(ixLm!, vp, mirrored)
            : {
                x: pWr.x + normalizeVec(pWr.x - pEl.x, pWr.y - pEl.y).x * foreLen * 0.55,
                y: pWr.y + normalizeVec(pWr.x - pEl.x, pWr.y - pEl.y).y * foreLen * 0.55
              };
        const handDist = Math.max(dist(pWr, handTip) * 1.4, foreLen * 0.52);
        const handDir = normalizeVec(handTip.x - pWr.x, handTip.y - pWr.y);
        const handEnd = {
          x: pWr.x + handDir.x * handDist,
          y: pWr.y + handDir.y * handDist
        };
        boxes.set(
          `hand:${cfg.side}`,
          makeSegmentFromEndpoints(
            `hand:${cfg.side}`,
            'hand',
            cfg.side,
            pWr,
            handEnd,
            Math.max(handDist * 0.42, shoulderSpan * 0.085),
            bodyLeftPointsPositiveX,
            true
          )
        );
      }
    }
  }

  // 5. Thighs, Lower Legs, Feet
  const legSides: readonly {
    side: 'left' | 'right';
    hp: number;
    kn: number;
    ak: number;
    hl: number;
    ft: number;
  }[] = [
    {
      side: 'left',
      hp: MP_LANDMARK.LEFT_HIP,
      kn: MP_LANDMARK.LEFT_KNEE,
      ak: MP_LANDMARK.LEFT_ANKLE,
      hl: MP_LANDMARK.LEFT_HEEL,
      ft: MP_LANDMARK.LEFT_FOOT_INDEX
    },
    {
      side: 'right',
      hp: MP_LANDMARK.RIGHT_HIP,
      kn: MP_LANDMARK.RIGHT_KNEE,
      ak: MP_LANDMARK.RIGHT_ANKLE,
      hl: MP_LANDMARK.RIGHT_HEEL,
      ft: MP_LANDMARK.RIGHT_FOOT_INDEX
    }
  ];

  for (const cfg of legSides) {
    const hpLm = landmarks[cfg.hp];
    const knLm = landmarks[cfg.kn];
    const akLm = landmarks[cfg.ak];
    const hlLm = landmarks[cfg.hl];
    const ftLm = landmarks[cfg.ft];

    if (isConfident(hpLm, knLm)) {
      const pHp = toScreen(hpLm!, vp, mirrored);
      const pKn = toScreen(knLm!, vp, mirrored);
      const thighLen = dist(pHp, pKn);
      boxes.set(
        `thigh:${cfg.side}`,
        makeSegmentFromEndpoints(
          `thigh:${cfg.side}`,
          'thigh',
          cfg.side,
          pHp,
          pKn,
          Math.max(thighLen * 0.25, hipSpan * 0.34),
          bodyLeftPointsPositiveX,
          true
        )
      );

      if (isConfident(akLm)) {
        const pAk = toScreen(akLm!, vp, mirrored);
        const legLen = dist(pKn, pAk);
        boxes.set(
          `lower_leg:${cfg.side}`,
          makeSegmentFromEndpoints(
            `lower_leg:${cfg.side}`,
            'lower_leg',
            cfg.side,
            pKn,
            pAk,
            Math.max(legLen * 0.19, hipSpan * 0.23),
            bodyLeftPointsPositiveX,
            true
          )
        );

        const ftConf = isConfident(ftLm);
        const hlConf = isConfident(hlLm);
        if (ftConf || hlConf) {
          const pStart = hlConf ? mid(pAk, toScreen(hlLm!, vp, mirrored)) : pAk;
          const pEnd = ftConf
            ? toScreen(ftLm!, vp, mirrored)
            : {
                x: pStart.x + normalizeVec(pAk.x - pKn.x, pAk.y - pKn.y).x * legLen * 0.35,
                y: pStart.y + normalizeVec(pAk.x - pKn.x, pAk.y - pKn.y).y * legLen * 0.35
              };
          const footLen = Math.max(dist(pStart, pEnd), legLen * 0.28);
          boxes.set(
            `foot:${cfg.side}`,
            makeSegmentFromEndpoints(
              `foot:${cfg.side}`,
              'foot',
              cfg.side,
              pStart,
              pEnd,
              Math.max(footLen * 0.38, hipSpan * 0.16),
              bodyLeftPointsPositiveX,
              true
            )
          );
        }
      }
    }
  }

  return boxes;
}

function projectPoint(
  uv: PointUV,
  box: SegmentBox,
  uSign: number
): ScreenPoint {
  const u = uv[0] * uSign * box.halfWidth;
  const v = uv[1] * box.length;
  return {
    x: box.origin.x + box.axisU.x * u + box.axisV.x * v,
    y: box.origin.y + box.axisU.y * u + box.axisV.y * v
  };
}

function getBoxKeysForStructure(
  structure: AnatomyStructure,
  boxes: Map<string, SegmentBox>
): { key: string; side: AnatomicalSide; uSign: number }[] {
  if (
    structure.segment === 'upper_arm' ||
    structure.segment === 'forearm' ||
    structure.segment === 'hand' ||
    structure.segment === 'thigh' ||
    structure.segment === 'lower_leg' ||
    structure.segment === 'foot'
  ) {
    const result: { key: string; side: AnatomicalSide; uSign: number }[] = [];
    for (const side of ['left', 'right'] as const) {
      const key = `${structure.segment}:${side}`;
      if (boxes.has(key)) {
        result.push({ key, side, uSign: 1 });
      }
    }
    return result;
  }

  // Axial / girdle segments (`head`, `neck`, `torso`, `pelvis`)
  if (!boxes.has(structure.segment)) return [];
  if (structure.sidedness === 'midline') {
    return [{ key: structure.segment, side: 'midline', uSign: 1 }];
  }
  // Bilateral structures placed on an axial box:
  // positive uSign -> +axisU (anatomical left), negative uSign -> -axisU (anatomical right)
  return [
    { key: structure.segment, side: 'left', uSign: 1 },
    { key: structure.segment, side: 'right', uSign: -1 }
  ];
}

function projectPolyList(
  polys: readonly (readonly PointUV[])[] | undefined,
  box: SegmentBox,
  uSign: number
): ScreenPoint[][] {
  if (!polys || polys.length === 0) return [];
  return polys.map((poly) => poly.map((uv) => projectPoint(uv, box, uSign)));
}

/**
 * Generates all transformed, screen-space anatomical structure instances
 * for the given layer ('bone' | 'muscle') and view ('front' | 'back').
 */
export function projectStructuresToScreen(
  boxes: Map<string, SegmentBox>,
  layer: StructureType,
  view: DetectedOrientation
): RenderedStructureInstance[] {
  const instances: RenderedStructureInstance[] = [];

  for (const structure of ANATOMY_STRUCTURES) {
    if (structure.type !== layer) continue;
    if (structure.view !== 'both' && structure.view !== view) continue;

    const art = ANATOMY_ARTWORK_REGISTRY.get(structure.artworkRef);
    if (!art) continue;

    const targets = getBoxKeysForStructure(structure, boxes);
    for (const target of targets) {
      const box = boxes.get(target.key);
      if (!box || !box.confident) continue;

      const anchor = projectPoint(art.anchor, box, target.uSign);
      const contours: ScreenPoint[][] = [];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let minV = 1;
      let maxV = 0;

      for (const contour of art.contours) {
        const pts: ScreenPoint[] = [];
        for (const uv of contour) {
          if (uv[1] < minV) minV = uv[1];
          if (uv[1] > maxV) maxV = uv[1];
          const p = projectPoint(uv, box, target.uSign);
          pts.push(p);
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        contours.push(pts);
      }

      const cutouts = projectPolyList(art.cutouts, box, target.uSign);
      const trabecularZones = projectPolyList(art.trabecularZones, box, target.uSign);
      const cartilageZones = projectPolyList(art.cartilageZones, box, target.uSign);
      const detailPaths = projectPolyList(art.detailPaths, box, target.uSign);

      // Compute fiber angle in screen space from local segment basis
      const radLocal = (art.fiberAngleDeg * Math.PI) / 180;
      const localDu = Math.cos(radLocal) * target.uSign;
      const localDv = Math.sin(radLocal);
      const worldDx = box.axisU.x * localDu + box.axisV.x * localDv;
      const worldDy = box.axisU.y * localDu + box.axisV.y * localDv;
      const fiberScreenAngleRad = Math.atan2(worldDy, worldDx);

      const proximalPt = projectPoint([art.anchor[0], minV], box, target.uSign);
      const distalPt = projectPoint([art.anchor[0], maxV], box, target.uSign);
      const orientedAxisU: ScreenPoint = {
        x: box.axisU.x * target.uSign,
        y: box.axisU.y * target.uSign
      };

      instances.push({
        instanceId: `${structure.id}:${target.side}`,
        structure,
        side: target.side,
        segmentKey: target.key,
        anchor,
        contours,
        cutouts,
        trabecularZones,
        cartilageZones,
        detailPaths,
        bounds: { minX, minY, maxX, maxY },
        fiberScreenAngleRad,
        proximalPt,
        distalPt,
        axisU: orientedAxisU,
        axisV: box.axisV,
        halfWidth: box.halfWidth,
        length: box.length
      });
    }
  }

  // Sort by layerOrder (deepest first -> superficial last)
  instances.sort((a, b) => a.structure.layerOrder - b.structure.layerOrder);
  return instances;
}
