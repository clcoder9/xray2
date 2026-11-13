import { ANATOMY_ARTWORK_REGISTRY, type PointUV } from '../assets/anatomyRegistry';
import {
  ANATOMY_STRUCTURES,
  type AnatomyStructure,
  type BodySegment,
  type StructureType
} from '../data/anatomyData';
import {
  computeBodyYawAndSideScore,
  computeHeadPose,
  type OrientationResult
} from './orientationDetector';
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
  /** Normalized anterior/nose shift along axisU in [-1, 1] for 2.5D head/body yaw */
  anteriorShiftU?: number;
  /** Segment-specific cardinal orientation ('front' | 'back' | 'left' | 'right') */
  segmentView?: DetectedOrientation;
  /** Screen horizontal direction (+1 or -1) the anterior side faces in profile */
  facingSign?: number;
  /** Real-time jaw opening ratio in [0..1] (for 'head' segment) */
  jawOpen?: number;
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

/** Structures visible when viewing the body or head from a lateral ('left' | 'right') angle */
const LATERAL_VISIBLE_IDS: ReadonlySet<string> = new Set([
  // Head & Neck
  'b_cranium',
  'b_maxilla',
  'b_mandibula',
  'b_vertebrae_cervicales',
  'm_frontalis',
  'm_orbicularis_oculi',
  'm_zygomaticus_major',
  'm_temporalis',
  'm_masseter',
  'm_orbicularis_oris',
  'm_sternocleidomastoideus',
  'm_scaleni',
  'm_splenius_capitis',
  'm_levator_scapulae',
  // Torso & Shoulder Girdle
  'b_clavicula',
  'b_costae_verae',
  'b_costae_spuriae',
  'b_scapula',
  'b_vertebrae_thoracicae',
  'b_vertebrae_lumbales',
  'm_pectoralis_major_sternocostalis',
  'm_serratus_anterior',
  'm_rectus_abdominis',
  'm_obliquus_externus_abdominis',
  'm_trapezius_descendens',
  'm_latissimus_dorsi',
  'm_erector_iliocostalis',
  // Pelvis
  'b_os_ilium',
  'b_os_sacrum',
  'b_trochanter_major',
  'm_gluteus_maximus',
  'm_gluteus_medius',
  'm_tensor_fasciae_latae',
  // Upper Limb
  'b_humerus',
  'b_epicondylus_humeri',
  'b_radius',
  'b_ulna',
  'b_ossa_carpi',
  'b_ossa_metacarpi',
  'b_phalanges_manus',
  'm_deltoideus_clavicularis',
  'm_deltoideus_acromialis',
  'm_deltoideus_spinalis',
  'm_biceps_caput_longum',
  'm_triceps_caput_laterale',
  'm_brachioradialis',
  'm_extensor_carpi_radialis_longus',
  // Lower Limb
  'b_femur',
  'b_patella',
  'b_tibia',
  'b_fibula',
  'b_talus',
  'b_calcaneus',
  'b_ossa_tarsi_metatarsi',
  'b_phalanges_pedis',
  'm_rectus_femoris',
  'm_vastus_lateralis',
  'm_tractus_iliotibialis',
  'm_biceps_femoris_longum',
  'm_tibialis_anterior',
  'm_fibularis_longus',
  'm_gastrocnemius_laterale',
  'm_soleus',
  'm_tendo_calcaneus',
  'm_aponeurosis_plantaris'
]);

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

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

function perpTowardSign(axisV: ScreenPoint, desiredSignX: number): ScreenPoint {
  const p1 = { x: axisV.y, y: -axisV.x };
  const p2 = { x: -axisV.y, y: axisV.x };
  if (Math.abs(p1.x) >= Math.abs(p2.x)) {
    return p1.x * desiredSignX >= 0 ? p1 : p2;
  }
  return p2.x * desiredSignX >= 0 ? p2 : p1;
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
 * from the 33 MediaPipe landmarks, stabilizing sagittal torso/pelvis dimensions in
 * side views and tracking independent head yaw & real-time jaw opening.
 */
export function buildSegmentRig(
  landmarks: readonly PoseLandmark[],
  vp: FrameViewport,
  mirrored: boolean,
  orientResult?: OrientationResult
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

  const ls = lsLm ? toScreen(lsLm, vp, mirrored) : { x: 0, y: 0 };
  const rs = rsLm ? toScreen(rsLm, vp, mirrored) : { x: 0, y: 0 };
  const lh = lhLm ? toScreen(lhLm, vp, mirrored) : { x: 0, y: 0 };
  const rh = rhLm ? toScreen(rhLm, vp, mirrored) : { x: 0, y: 0 };

  const shouldersConf = isConfident(lsLm, rsLm);
  const hipsConf = isConfident(lhLm, rhLm);

  const shoulderMid = mid(ls, rs);
  const hipMid = mid(lh, rh);
  const rawShoulderSpan = shouldersConf ? dist(ls, rs) : 120;
  const rawHipSpan = hipsConf ? dist(lh, rh) : rawShoulderSpan * 0.72;

  const bodyYaw = orientResult
    ? undefined
    : computeBodyYawAndSideScore(landmarks);
  const bodyView: DetectedOrientation = orientResult?.view ?? bodyYaw!.rawView;
  const isLateralBody = bodyView === 'left' || bodyView === 'right';

  // Coronal reference shoulder span prevents torso/pelvis collapse in side views
  const torsoLenEst =
    shouldersConf && hipsConf ? dist(shoulderMid, hipMid) : rawShoulderSpan * 1.48;
  const coronalShoulderSpan = Math.max(
    rawShoulderSpan,
    hipsConf ? torsoLenEst * 0.56 : 0,
    80
  );
  const shoulderSpan = coronalShoulderSpan;
  const hipSpan = Math.max(rawHipSpan, coronalShoulderSpan * 0.68);

  // Determine screen-space facing sign (+1 = facing +X, -1 = facing -X)
  const nosePt = noseLm ? toScreen(noseLm, vp, mirrored) : null;
  let bodyFacingSign = bodyView === 'left' ? 1 : bodyView === 'right' ? -1 : 1;
  if (mirrored && (bodyView === 'left' || bodyView === 'right')) {
    bodyFacingSign = -bodyFacingSign;
  }
  if (nosePt && shouldersConf && Math.abs(nosePt.x - shoulderMid.x) > 4) {
    bodyFacingSign = Math.sign(nosePt.x - shoulderMid.x);
  }

  // Determine whether anatomical left is currently toward +X in screen space
  let bodyLeftPointsPositiveX = !mirrored;
  if (shouldersConf && Math.abs(ls.x - rs.x) > coronalShoulderSpan * 0.28) {
    bodyLeftPointsPositiveX = ls.x > rs.x;
  } else if (hipsConf && Math.abs(lh.x - rh.x) > hipSpan * 0.28) {
    bodyLeftPointsPositiveX = lh.x > rh.x;
  }

  const isNarrowShoulderView =
    isLateralBody || (shouldersConf && rawShoulderSpan < coronalShoulderSpan * 0.48);

  // Torso axis vectors: lock orthogonal to spine when shoulders stack in side view
  const rawTorsoAxisV =
    shouldersConf && hipsConf
      ? normalizeVec(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y)
      : { x: 0, y: 1 };
  const torsoAxisU =
    shouldersConf && !isNarrowShoulderView
      ? normalizeVec(ls.x - rs.x, ls.y - rs.y)
      : isNarrowShoulderView
        ? perpTowardSign(rawTorsoAxisV, bodyFacingSign)
        : { x: bodyLeftPointsPositiveX ? 1 : -1, y: 0 };

  const sagittalTorsoHalfW = coronalShoulderSpan * 0.36;
  const effectiveTorsoHalfW = isNarrowShoulderView
    ? Math.max(rawShoulderSpan * 0.56, sagittalTorsoHalfW)
    : rawShoulderSpan * 0.56;

  // 1. Torso segment (shoulderMid -> hipMid)
  if (shouldersConf && hipsConf) {
    const torsoTop = {
      x: shoulderMid.x - (hipMid.x - shoulderMid.x) * 0.06,
      y: shoulderMid.y - (hipMid.y - shoulderMid.y) * 0.06
    };
    const torsoBottom = lerpPt(shoulderMid, hipMid, 0.92);
    const torsoBox = makeSegmentFromEndpoints(
      'torso',
      'torso',
      'midline',
      torsoTop,
      torsoBottom,
      effectiveTorsoHalfW,
      bodyLeftPointsPositiveX,
      true,
      torsoAxisU
    );
    torsoBox.segmentView = bodyView;
    torsoBox.facingSign = bodyFacingSign;
    boxes.set('torso', torsoBox);
  } else if (shouldersConf) {
    // Upper-body partial frame fallback: infer torso extent from shoulder width
    const estHeight = coronalShoulderSpan * 1.48;
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
    const torsoBox = makeSegmentFromEndpoints(
      'torso',
      'torso',
      'midline',
      torsoTop,
      torsoBottom,
      effectiveTorsoHalfW,
      bodyLeftPointsPositiveX,
      true,
      torsoAxisU
    );
    torsoBox.segmentView = bodyView;
    torsoBox.facingSign = bodyFacingSign;
    boxes.set('torso', torsoBox);
  }

  // 2. Pelvis segment (slightly above hipMid -> trochanter/pubic base)
  if (hipsConf) {
    const downDir = shouldersConf
      ? normalizeVec(hipMid.x - shoulderMid.x, hipMid.y - shoulderMid.y)
      : { x: 0, y: 1 };
    const isNarrowHipView = isLateralBody || rawHipSpan < hipSpan * 0.45;
    const pelvisAxisU = !isNarrowHipView
      ? normalizeVec(lh.x - rh.x, lh.y - rh.y)
      : perpTowardSign(downDir, bodyFacingSign);
    const torsoRefLen = shouldersConf ? dist(shoulderMid, hipMid) : hipSpan * 1.9;
    const pelvisTop = {
      x: hipMid.x - downDir.x * torsoRefLen * 0.17,
      y: hipMid.y - downDir.y * torsoRefLen * 0.17
    };
    const pelvisBottom = {
      x: hipMid.x + downDir.x * torsoRefLen * 0.2,
      y: hipMid.y + downDir.y * torsoRefLen * 0.2
    };
    const pelvisHalfW = isNarrowHipView
      ? Math.max(rawHipSpan * 0.72, coronalShoulderSpan * 0.34)
      : Math.max(rawHipSpan * 0.72, coronalShoulderSpan * 0.48);
    const pelvisBox = makeSegmentFromEndpoints(
      'pelvis',
      'pelvis',
      'midline',
      pelvisTop,
      pelvisBottom,
      pelvisHalfW,
      bodyLeftPointsPositiveX,
      true,
      pelvisAxisU
    );
    pelvisBox.segmentView = bodyView;
    pelvisBox.facingSign = bodyFacingSign;
    boxes.set('pelvis', pelvisBox);
  }

  // 3. Head & Neck segments (decoupled from mouth landmarks so jaw movement never stretches skull)
  const headConf =
    isConfident(noseLm) ||
    isConfident(leEarLm, reEarLm) ||
    isConfident(leEyeLm, reEyeLm);
  if (headConf) {
    const earsConf = isConfident(leEarLm, reEarLm);
    const leftEarOnly = !earsConf && isConfident(leEarLm);
    const rightEarOnly = !earsConf && isConfident(reEarLm);
    const eyesConf = isConfident(leEyeLm, reEyeLm);

    const leEarPt = leEarLm ? toScreen(leEarLm, vp, mirrored) : null;
    const reEarPt = reEarLm ? toScreen(reEarLm, vp, mirrored) : null;
    const leEyePt = leEyeLm ? toScreen(leEyeLm, vp, mirrored) : null;
    const reEyePt = reEyeLm ? toScreen(reEyeLm, vp, mirrored) : null;

    const earMid = earsConf && leEarPt && reEarPt
      ? mid(leEarPt, reEarPt)
      : leftEarOnly && leEarPt
        ? leEarPt
        : rightEarOnly && reEarPt
          ? reEarPt
          : null;
    const eyeMid = eyesConf && leEyePt && reEyePt ? mid(leEyePt, reEyePt) : null;

    const headRefCenter =
      nosePt && earMid
        ? mid(nosePt, earMid)
        : eyeMid ?? nosePt ?? earMid ?? shoulderMid;

    // Coronal reference floor keeps cranial proportions stable during head turns
    const earWidthEst =
      earsConf && leEarPt && reEarPt ? dist(leEarPt, reEarPt) * 1.24 : 0;
    const eyeWidthEst =
      eyesConf && leEyePt && reEyePt ? dist(leEyePt, reEyePt) * 2.55 : 0;
    const noseEarDepthEst =
      nosePt && earMid ? dist(nosePt, earMid) * 1.65 : 0;
    const shoulderHeadWidthFloor = shouldersConf ? coronalShoulderSpan * 0.44 : 0;

    const cranialWidth = Math.max(
      earWidthEst,
      eyeWidthEst,
      noseEarDepthEst,
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
      eyeMid && nosePt
        ? normalizeVec(eyeMid.x - nosePt.x, eyeMid.y - nosePt.y)
        : shoulderHeadAxis;
    const upDir =
      eyeMid && nosePt && shouldersConf
        ? normalizeVec(
            faceUpAxis.x * 0.65 + shoulderHeadAxis.x * 0.35,
            faceUpAxis.y * 0.65 + shoulderHeadAxis.y * 0.35
          )
        : shoulderHeadAxis;

    // Strictly upper-cranium height cues (never mouth landmarks!)
    const eyeNoseHeightEst =
      eyeMid && nosePt ? dist(eyeMid, nosePt) * 5.2 : 0;
    const earSpanHeightEst =
      earsConf && leEarPt && reEarPt ? dist(leEarPt, reEarPt) * 1.48 : 0;
    const shoulderHeadHeightEst = shouldersConf
      ? dist(headRefCenter, shoulderMid) * 0.94
      : 0;
    const headHeight = Math.max(
      cranialWidth * 1.22,
      eyeNoseHeightEst,
      earSpanHeightEst,
      shoulderHeadHeightEst,
      42
    );

    // Compute cranial pivot center (remains on skull vault even when head turns)
    const upperFaceAnchor =
      eyeMid && nosePt ? lerpPt(eyeMid, nosePt, 0.48) : headRefCenter;
    const craniumCenter =
      earMid && nosePt
        ? lerpPt(earMid, upperFaceAnchor, earsConf ? 0.35 : 0.38)
        : upperFaceAnchor;

    const headPose =
      orientResult?.head ??
      computeHeadPose(
        landmarks,
        bodyView,
        bodyYaw?.yawRad ?? 0,
        null
      );

    const headView = headPose.view;
    const isHeadProfile = headView === 'left' || headView === 'right';

    // Determine screen-space nose facing direction for profile head
    let headFacingSign = headPose.facingSign;
    if (mirrored && !orientResult) {
      headFacingSign = -headFacingSign;
    }
    if (nosePt && earMid && Math.abs(nosePt.x - earMid.x) > 4) {
      headFacingSign = Math.sign(nosePt.x - earMid.x);
    }

    // Build headAxisU orthogonal to upDir
    let candHeadU: ScreenPoint;
    if (
      !isHeadProfile &&
      earsConf &&
      leEarPt &&
      reEarPt &&
      dist(leEarPt, reEarPt) > cranialWidth * 0.35
    ) {
      candHeadU = normalizeVec(leEarPt.x - reEarPt.x, leEarPt.y - reEarPt.y);
    } else if (
      !isHeadProfile &&
      eyesConf &&
      leEyePt &&
      reEyePt &&
      dist(leEyePt, reEyePt) > cranialWidth * 0.16
    ) {
      candHeadU = normalizeVec(leEyePt.x - reEyePt.x, leEyePt.y - reEyePt.y);
    } else if (isHeadProfile) {
      // In lateral profile, +axisU points toward the anterior face (nose)
      candHeadU = perpTowardSign({ x: -upDir.x, y: -upDir.y }, headFacingSign);
    } else {
      candHeadU = torsoAxisU;
    }

    // Enforce strict orthogonality against upDir
    const dotUp = candHeadU.x * upDir.x + candHeadU.y * upDir.y;
    const headAxisU = normalizeVec(
      candHeadU.x - dotUp * upDir.x,
      candHeadU.y - dotUp * upDir.y
    );

    // Normalized nose shift along headAxisU for 2.5D oblique projection
    let anteriorShiftU = 0;
    if (nosePt) {
      const dxNose = nosePt.x - craniumCenter.x;
      const dyNose = nosePt.y - craniumCenter.y;
      const projNoseOnU = dxNose * headAxisU.x + dyNose * headAxisU.y;
      anteriorShiftU = clamp(projNoseOnU / Math.max(12, cranialWidth * 0.36), -1, 1);
    }

    const headTop = {
      x: craniumCenter.x + upDir.x * headHeight * 0.5,
      y: craniumCenter.y + upDir.y * headHeight * 0.5
    };
    const chinPt = {
      x: craniumCenter.x - upDir.x * headHeight * 0.5,
      y: craniumCenter.y - upDir.y * headHeight * 0.5
    };

    const headBox = makeSegmentFromEndpoints(
      'head',
      'head',
      'midline',
      headTop,
      chinPt,
      cranialWidth * 0.52,
      bodyLeftPointsPositiveX,
      true,
      headAxisU
    );
    headBox.anteriorShiftU = anteriorShiftU;
    headBox.segmentView = headView;
    headBox.facingSign = headFacingSign;
    headBox.jawOpen = headPose.jawOpen;
    boxes.set('head', headBox);

    if (shouldersConf) {
      const neckTop = lerpPt(headTop, chinPt, 0.82);
      const neckBottom = lerpPt(shoulderMid, hipMid, hipsConf ? 0.05 : 0.0);
      const neckBox = makeSegmentFromEndpoints(
        'neck',
        'neck',
        'midline',
        neckTop,
        neckBottom,
        Math.max(cranialWidth * 0.36, coronalShoulderSpan * 0.19),
        bodyLeftPointsPositiveX,
        true,
        isHeadProfile ? headAxisU : torsoAxisU
      );
      neckBox.segmentView = isHeadProfile ? headView : bodyView;
      neckBox.facingSign = isHeadProfile ? headFacingSign : bodyFacingSign;
      boxes.set('neck', neckBox);
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

/**
 * Applies real-time kinematic TMJ jaw articulation to head bone and muscle UV coordinates.
 */
function applyJawArticulation(
  uv: PointUV,
  structureId: string,
  jawOpen: number,
  isLateral: boolean
): PointUV {
  if (jawOpen <= 0.01) return uv;
  const [u, v] = uv;

  if (structureId === 'b_mandibula') {
    if (isLateral) {
      // Pivot around lateral TMJ condyle (-0.02, 0.53) downward & posteriorly
      const u0 = -0.02;
      const v0 = 0.53;
      const du = u - u0;
      const dv = v - v0;
      if (dv < 0.01 && Math.abs(du) < 0.1) return uv;
      const theta = jawOpen * 0.42; // up to ~24 deg mandibular depression
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      return [u0 + du * cos - dv * sin, v0 + du * sin + dv * cos];
    } else {
      // Front/oblique: TMJ condyles (v <= 0.55) stay anchored, mandibular body drops
      if (v <= 0.55) return uv;
      const t = clamp((v - 0.54) / 0.30, 0, 1);
      return [u * (1 - jawOpen * 0.045 * t), v + jawOpen * 0.145 * t];
    }
  }

  if (structureId === 'm_masseter') {
    if (v <= 0.53) return uv;
    const t = clamp((v - 0.52) / 0.34, 0, 1);
    // Elongate downward while gently tapering belly width
    const centerU = isLateral ? 0.22 : 0.69;
    const uPulled = centerU + (u - centerU) * (1 - jawOpen * 0.13 * t);
    return [uPulled, v + jawOpen * 0.135 * t];
  }

  if (structureId === 'm_temporalis') {
    if (v <= 0.42) return uv;
    const t = clamp((v - 0.42) / 0.20, 0, 1);
    return [u, v + jawOpen * 0.075 * t];
  }

  if (structureId === 'm_orbicularis_oris') {
    const dv = v - 0.75;
    if (dv < 0) {
      // Upper lip slightly lifts/tracks maxilla
      return [u, v - jawOpen * 0.012];
    }
    // Lower lip drops with mandible, opening oral ring & inner cavity
    return [u, v + jawOpen * (0.045 + Math.min(0.11, dv * 0.72))];
  }

  if (structureId === 'm_zygomaticus_major') {
    if (v <= 0.55) return uv;
    const t = clamp((v - 0.50) / 0.24, 0, 1);
    return [u, v + jawOpen * 0.075 * t];
  }

  return uv;
}

function transformHeadUV(
  uv: PointUV,
  uSign: number,
  coronalDepthW: number,
  anteriorShiftU: number,
  isLateralGeometry: boolean
): PointUV {
  if (isLateralGeometry) {
    // Lateral profile geometry already uses +u = anterior, -u = posterior
    return uv;
  }
  if (Math.abs(anteriorShiftU) <= 0.04) {
    return [uv[0] * uSign, uv[1]];
  }
  const s = clamp(anteriorShiftU, -0.82, 0.82);
  const c = Math.sqrt(Math.max(0.28, 1 - s * s));
  return [uv[0] * uSign * c + coronalDepthW * s, uv[1]];
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

function isStructureVisibleInView(
  structure: AnatomyStructure,
  segView: DetectedOrientation
): boolean {
  if (segView === 'left' || segView === 'right') {
    return LATERAL_VISIBLE_IDS.has(structure.id);
  }
  return structure.view === 'both' || structure.view === segView;
}

function getBoxKeysForStructure(
  structure: AnatomyStructure,
  boxes: Map<string, SegmentBox>,
  globalView: DetectedOrientation
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
      // Near-side occlusion culling when body is viewed from left/right profile
      if ((globalView === 'left' || globalView === 'right') && side !== globalView) {
        continue;
      }
      const key = `${structure.segment}:${side}`;
      if (boxes.has(key)) {
        result.push({ key, side, uSign: 1 });
      }
    }
    return result;
  }

  // Axial / girdle segments (`head`, `neck`, `torso`, `pelvis`)
  const box = boxes.get(structure.segment);
  if (!box) return [];
  const segView = box.segmentView ?? globalView;

  if (structure.sidedness === 'midline') {
    return [{ key: structure.segment, side: 'midline', uSign: 1 }];
  }

  if (segView === 'left' || segView === 'right') {
    // Only project near-side bilateral structure onto axial segment in lateral profile
    return [
      {
        key: structure.segment,
        side: segView,
        uSign: segView === 'left' ? 1 : -1
      }
    ];
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
  uSign: number,
  mapUV: (uv: PointUV) => PointUV
): ScreenPoint[][] {
  if (!polys || polys.length === 0) return [];
  return polys.map((poly) => poly.map((uv) => projectPoint(mapUV(uv), box, uSign)));
}

/**
 * Generates all transformed, screen-space anatomical structure instances
 * for the given layer ('bone' | 'muscle') and view ('front' | 'back' | 'left' | 'right').
 */
export function projectStructuresToScreen(
  boxes: Map<string, SegmentBox>,
  layer: StructureType,
  view: DetectedOrientation
): RenderedStructureInstance[] {
  const instances: RenderedStructureInstance[] = [];

  for (const structure of ANATOMY_STRUCTURES) {
    if (structure.type !== layer) continue;

    const art = ANATOMY_ARTWORK_REGISTRY.get(structure.artworkRef);
    if (!art) continue;

    const targets = getBoxKeysForStructure(structure, boxes, view);
    for (const target of targets) {
      const box = boxes.get(target.key);
      if (!box || !box.confident) continue;

      const effectiveView: DetectedOrientation =
        box.segment === 'head' || box.segment === 'neck'
          ? box.segmentView ?? view
          : view;

      if (!isStructureVisibleInView(structure, effectiveView)) continue;

      const isLateralSeg = effectiveView === 'left' || effectiveView === 'right';
      const useLateralArt = Boolean(isLateralSeg && art.lateralGeometry);
      const activeArt = useLateralArt ? art.lateralGeometry! : art;

      // When using lateralGeometry, +u is always anterior (+1 along box.axisU in lateral setup)
      const projUSign = useLateralArt ? 1 : box.segment === 'head' ? 1 : target.uSign;
      const jawOpen = box.segment === 'head' ? box.jawOpen ?? 0 : 0;
      const anteriorShiftU = box.segment === 'head' ? box.anteriorShiftU ?? 0 : 0;
      const coronalDepthW = art.coronalDepthW ?? 0.2;

      const mapUV = (uv: PointUV, depthOverride?: number): PointUV => {
        const articulated = applyJawArticulation(uv, structure.id, jawOpen, useLateralArt);
        if (box.segment === 'head') {
          return transformHeadUV(
            articulated,
            target.uSign,
            depthOverride ?? coronalDepthW,
            anteriorShiftU,
            useLateralArt
          );
        }
        return articulated;
      };

      const anchor = projectPoint(mapUV(activeArt.anchor), box, projUSign);
      const contours: ScreenPoint[][] = [];
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let minV = 1;
      let maxV = 0;

      for (const contour of activeArt.contours) {
        const pts: ScreenPoint[] = [];
        for (const uv of contour) {
          if (uv[1] < minV) minV = uv[1];
          if (uv[1] > maxV) maxV = uv[1];
          const p = projectPoint(mapUV(uv), box, projUSign);
          pts.push(p);
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }
        contours.push(pts);
      }

      // Cranium facial cutouts (orbits, nasal cavity) sit on anterior facial arc (w = 0.56)
      const cutoutDepthOverride =
        !useLateralArt && structure.id === 'b_cranium' ? 0.56 : undefined;
      const cutouts = projectPolyList(activeArt.cutouts, box, projUSign, (uv) =>
        mapUV(uv, cutoutDepthOverride)
      );
      const trabecularZones = projectPolyList(activeArt.trabecularZones, box, projUSign, mapUV);
      const cartilageZones = projectPolyList(activeArt.cartilageZones, box, projUSign, mapUV);
      const detailPaths = projectPolyList(activeArt.detailPaths, box, projUSign, mapUV);

      // Compute fiber angle in screen space from local segment basis
      const fiberAngleDeg =
        (useLateralArt ? art.lateralGeometry?.fiberAngleDeg : undefined) ?? art.fiberAngleDeg;
      const radLocal = (fiberAngleDeg * Math.PI) / 180;
      const localDu = Math.cos(radLocal) * projUSign;
      const localDv = Math.sin(radLocal);
      const worldDx = box.axisU.x * localDu + box.axisV.x * localDv;
      const worldDy = box.axisU.y * localDu + box.axisV.y * localDv;
      const fiberScreenAngleRad = Math.atan2(worldDy, worldDx);

      const proximalPt = projectPoint(mapUV([activeArt.anchor[0], minV]), box, projUSign);
      const distalPt = projectPoint(mapUV([activeArt.anchor[0], maxV]), box, projUSign);
      const orientedAxisU: ScreenPoint = {
        x: box.axisU.x * projUSign,
        y: box.axisU.y * projUSign
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
