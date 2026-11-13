import type { PointUV } from './anatomyRegistry';

export interface BoneGeometrySpec {
  contours: PointUV[][];
  cutouts?: PointUV[][];
  trabecularZones?: PointUV[][];
  cartilageZones?: PointUV[][];
  detailPaths?: PointUV[][];
}

function r(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function pt(u: number, v: number): PointUV {
  return [r(u), r(v)];
}

/**
 * Generates an anatomical ellipse/oval contour.
 */
export function makeOval(
  cu: number,
  cv: number,
  ru: number,
  rv: number,
  steps = 16,
  rotRad = 0
): PointUV[] {
  const pts: PointUV[] = [];
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const lx = Math.cos(a) * ru;
    const ly = Math.sin(a) * rv;
    pts.push(pt(cu + lx * cos - ly * sin, cv + lx * sin + ly * cos));
  }
  return pts;
}

/**
 * Builds a single anatomical vertebra with vertebral body, bilateral transverse
 * processes, and optional spinous process shadow.
 */
function buildVertebra(
  cv: number,
  bodyHW: number,
  bodyHH: number,
  transSpan: number,
  transThick: number,
  spinousDrop: number
): {
  contour: PointUV[];
  trabecular: PointUV[];
  details: PointUV[][];
} {
  // Silhouette combining vertebral body + flaring bilateral transverse processes
  const topY = cv - bodyHH;
  const botY = cv + bodyHH;
  const contour: PointUV[] = [
    pt(-bodyHW * 0.85, topY),
    pt(0, topY + bodyHH * 0.08),
    pt(bodyHW * 0.85, topY),
    pt(bodyHW * 1.02, cv - transThick * 0.65),
    pt(transSpan, cv - transThick * 0.45),
    pt(transSpan * 1.04, cv),
    pt(transSpan * 0.94, cv + transThick * 0.55),
    pt(bodyHW * 0.98, cv + transThick * 0.65),
    pt(bodyHW * 0.88, botY),
    pt(0, botY + bodyHH * 0.12),
    pt(-bodyHW * 0.88, botY),
    pt(-bodyHW * 0.98, cv + transThick * 0.65),
    pt(-transSpan * 0.94, cv + transThick * 0.55),
    pt(-transSpan * 1.04, cv),
    pt(-transSpan, cv - transThick * 0.45),
    pt(-bodyHW * 1.02, cv - transThick * 0.65)
  ];

  const trabecular = makeOval(0, cv, bodyHW * 0.72, bodyHH * 0.72, 12);

  // Endplate ridges + teardrop spinous process highlight
  const details: PointUV[][] = [
    [pt(-bodyHW * 0.76, topY + bodyHH * 0.22), pt(bodyHW * 0.76, topY + bodyHH * 0.22)],
    [pt(-bodyHW * 0.76, botY - bodyHH * 0.22), pt(bodyHW * 0.76, botY - bodyHH * 0.22)],
    [
      pt(0, cv - bodyHH * 0.15),
      pt(bodyHW * 0.22, cv + bodyHH * 0.35),
      pt(0, cv + bodyHH + spinousDrop),
      pt(-bodyHW * 0.22, cv + bodyHH * 0.35),
      pt(0, cv - bodyHH * 0.15)
    ]
  ];

  return { contour, trabecular, details };
}

export function buildVertebralSection(opts: {
  count: number;
  vStart: number;
  vEnd: number;
  bodyHWStart: number;
  bodyHWEnd: number;
  transSpanStart: number;
  transSpanEnd: number;
  spinousDrop: number;
  includeBottomDisc?: boolean;
}): BoneGeometrySpec {
  const contours: PointUV[][] = [];
  const trabecularZones: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  const step = (opts.vEnd - opts.vStart) / opts.count;
  for (let i = 0; i < opts.count; i++) {
    const t = opts.count > 1 ? i / (opts.count - 1) : 0;
    const cv = opts.vStart + (i + 0.5) * step;
    const bodyHW = opts.bodyHWStart + (opts.bodyHWEnd - opts.bodyHWStart) * t;
    const transSpan = opts.transSpanStart + (opts.transSpanEnd - opts.transSpanStart) * t;
    const bodyHH = step * 0.36;
    const transThick = step * 0.22;

    const vert = buildVertebra(
      cv,
      bodyHW,
      bodyHH,
      transSpan,
      transThick,
      opts.spinousDrop
    );
    contours.push(vert.contour);
    trabecularZones.push(vert.trabecular);
    detailPaths.push(...vert.details);

    // Intervertebral disc below vertebra
    if (i < opts.count - 1 || opts.includeBottomDisc) {
      const discY = cv + step * 0.5;
      cartilageZones.push(
        makeOval(0, discY, bodyHW * 0.92, step * 0.11, 12)
      );
    }
  }

  return { contours, trabecularZones, cartilageZones, detailPaths };
}

/**
 * Generates curved anatomical ribs (single side, u >= 0) with costal cartilage bridges.
 */
export function buildRibCageSection(opts: {
  isTrueRibs: boolean;
}): BoneGeometrySpec {
  const contours: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];
  const trabecularZones: PointUV[][] = [];

  if (opts.isTrueRibs) {
    // Ribs 1..7: curved bony arcs from thoracic spine to costochondral junction,
    // plus hyaline costal cartilage bars connecting to the sternum notches.
    const ribConfigs = [
      { vSpine: 0.085, vLat: 0.115, vFront: 0.125, uSpine: 0.09, uLat: 0.48, uCostalEnd: 0.24, uSternum: 0.095, vSternum: 0.115, thick: 0.013 },
      { vSpine: 0.125, vLat: 0.165, vFront: 0.185, uSpine: 0.09, uLat: 0.60, uCostalEnd: 0.30, uSternum: 0.075, vSternum: 0.168, thick: 0.014 },
      { vSpine: 0.168, vLat: 0.220, vFront: 0.248, uSpine: 0.09, uLat: 0.69, uCostalEnd: 0.34, uSternum: 0.072, vSternum: 0.212, thick: 0.015 },
      { vSpine: 0.212, vLat: 0.274, vFront: 0.308, uSpine: 0.09, uLat: 0.74, uCostalEnd: 0.37, uSternum: 0.070, vSternum: 0.256, thick: 0.015 },
      { vSpine: 0.258, vLat: 0.326, vFront: 0.365, uSpine: 0.09, uLat: 0.77, uCostalEnd: 0.40, uSternum: 0.068, vSternum: 0.300, thick: 0.015 },
      { vSpine: 0.304, vLat: 0.376, vFront: 0.420, uSpine: 0.09, uLat: 0.77, uCostalEnd: 0.43, uSternum: 0.064, vSternum: 0.342, thick: 0.015 },
      { vSpine: 0.350, vLat: 0.424, vFront: 0.472, uSpine: 0.09, uLat: 0.75, uCostalEnd: 0.46, uSternum: 0.056, vSternum: 0.382, thick: 0.014 }
    ];

    for (const c of ribConfigs) {
      const t = c.thick;
      // Sweeping rib contour: spine -> posterior costal angle -> lateral arch -> anterior costochondral end
      const uMid1 = c.uSpine + (c.uLat - c.uSpine) * 0.55;
      const vMid1 = c.vSpine + (c.vLat - c.vSpine) * 0.48;
      const uMid2 = c.uLat * 0.96;
      const vMid2 = c.vLat + (c.vFront - c.vLat) * 0.45;
      const uMid3 = (c.uLat + c.uCostalEnd) * 0.52;
      const vMid3 = c.vFront - 0.006;

      contours.push([
        pt(c.uSpine, c.vSpine - t * 0.7),
        pt(uMid1, vMid1 - t * 0.95),
        pt(c.uLat, c.vLat - t),
        pt(uMid2, vMid2 - t * 0.95),
        pt(uMid3, vMid3 - t * 0.85),
        pt(c.uCostalEnd, c.vFront - t * 0.8),
        pt(c.uCostalEnd - 0.008, c.vFront + t * 0.8),
        pt(uMid3, vMid3 + t * 0.85),
        pt(uMid2 - 0.012, vMid2 + t * 0.95),
        pt(c.uLat - 0.015, c.vLat + t),
        pt(uMid1, vMid1 + t * 0.95),
        pt(c.uSpine, c.vSpine + t * 0.7)
      ]);

      // Costal cartilage bar bridging anterior bony rib to sternum
      const uCartMid = (c.uCostalEnd + c.uSternum) * 0.5;
      const vCartMid = (c.vFront + c.vSternum) * 0.5 + 0.012;
      cartilageZones.push([
        pt(c.uCostalEnd, c.vFront - t * 0.7),
        pt(uCartMid, vCartMid - t * 0.68),
        pt(c.uSternum, c.vSternum - t * 0.6),
        pt(c.uSternum, c.vSternum + t * 0.6),
        pt(uCartMid, vCartMid + t * 0.68),
        pt(c.uCostalEnd, c.vFront + t * 0.7)
      ]);

      // Subcostal groove highlight line
      detailPaths.push([
        pt(c.uSpine + 0.04, c.vSpine + t * 0.25),
        pt(uMid1, vMid1 + t * 0.35),
        pt(c.uLat - 0.01, c.vLat + t * 0.35),
        pt(uMid3, vMid3 + t * 0.25)
      ]);

      trabecularZones.push(makeOval(c.uCostalEnd - 0.01, c.vFront, 0.025, t * 0.8, 8));
    }
  } else {
    // Ribs 8..10 (false ribs curving upward into costal arch) + Ribs 11..12 (floating ribs)
    const ribConfigs = [
      { vSpine: 0.396, vLat: 0.474, vFront: 0.525, uSpine: 0.10, uLat: 0.72, uCostalEnd: 0.50, uTarget: 0.31, vTarget: 0.448, thick: 0.014, floating: false },
      { vSpine: 0.440, vLat: 0.518, vFront: 0.572, uSpine: 0.10, uLat: 0.68, uCostalEnd: 0.53, uTarget: 0.38, vTarget: 0.486, thick: 0.013, floating: false },
      { vSpine: 0.484, vLat: 0.560, vFront: 0.614, uSpine: 0.10, uLat: 0.64, uCostalEnd: 0.54, uTarget: 0.45, vTarget: 0.535, thick: 0.012, floating: false },
      { vSpine: 0.526, vLat: 0.592, vFront: 0.628, uSpine: 0.10, uLat: 0.55, uCostalEnd: 0.53, uTarget: 0.53, vTarget: 0.628, thick: 0.011, floating: true },
      { vSpine: 0.568, vLat: 0.620, vFront: 0.646, uSpine: 0.10, uLat: 0.43, uCostalEnd: 0.42, uTarget: 0.42, vTarget: 0.646, thick: 0.010, floating: true }
    ];

    for (const c of ribConfigs) {
      const t = c.thick;
      const uMid1 = c.uSpine + (c.uLat - c.uSpine) * 0.55;
      const vMid1 = c.vSpine + (c.vLat - c.vSpine) * 0.5;
      contours.push([
        pt(c.uSpine, c.vSpine - t * 0.7),
        pt(uMid1, vMid1 - t * 0.9),
        pt(c.uLat, c.vLat - t * 0.9),
        pt(c.uCostalEnd, c.vFront - t * 0.7),
        pt(c.uCostalEnd - 0.01, c.vFront + t * 0.7),
        pt(c.uLat - 0.015, c.vLat + t * 0.9),
        pt(uMid1, vMid1 + t * 0.9),
        pt(c.uSpine, c.vSpine + t * 0.7)
      ]);

      if (!c.floating) {
        const uCartMid = (c.uCostalEnd + c.uTarget) * 0.5;
        const vCartMid = (c.vFront + c.vTarget) * 0.5 + 0.01;
        cartilageZones.push([
          pt(c.uCostalEnd, c.vFront - t * 0.65),
          pt(uCartMid, vCartMid - t * 0.6),
          pt(c.uTarget, c.vTarget - t * 0.55),
          pt(c.uTarget, c.vTarget + t * 0.55),
          pt(uCartMid, vCartMid + t * 0.6),
          pt(c.uCostalEnd, c.vFront + t * 0.65)
        ]);
      } else {
        cartilageZones.push(makeOval(c.uCostalEnd + 0.01, c.vFront, 0.018, t * 0.65, 8));
      }

      detailPaths.push([
        pt(c.uSpine + 0.04, c.vSpine + t * 0.25),
        pt(uMid1, vMid1 + t * 0.35),
        pt(c.uLat - 0.01, c.vLat + t * 0.3)
      ]);
    }
  }

  return { contours, cartilageZones, detailPaths, trabecularZones };
}

/**
 * Generates the detailed Cranium (vault, zygomatic arches, mastoid processes,
 * orbital cavities, piriform nasal aperture, sutures & trabecular brow/vault).
 */
export function buildCraniumGeometry(): BoneGeometrySpec {
  const craniumOutline: PointUV[] = [
    pt(0, 0.02),
    pt(0.32, 0.03),
    pt(0.62, 0.09),
    pt(0.83, 0.20),
    pt(0.90, 0.33),
    pt(0.85, 0.43),
    pt(0.91, 0.50), // zygomatic arch lateral flare
    pt(0.84, 0.56),
    pt(0.74, 0.55), // zygomatic arch posterior
    pt(0.75, 0.63), // mastoid process
    pt(0.62, 0.65),
    pt(0.46, 0.52), // maxilla-zygomatic junction
    pt(0.24, 0.49),
    pt(0, 0.50),
    pt(-0.24, 0.49),
    pt(-0.46, 0.52),
    pt(-0.62, 0.65),
    pt(-0.75, 0.63),
    pt(-0.74, 0.55),
    pt(-0.84, 0.56),
    pt(-0.91, 0.50),
    pt(-0.85, 0.43),
    pt(-0.90, 0.33),
    pt(-0.83, 0.20),
    pt(-0.62, 0.09),
    pt(-0.32, 0.03)
  ];

  // Bilateral Eye Orbits (slightly squared-trapezoidal rounded sockets)
  const makeOrbit = (sign: number): PointUV[] => [
    pt(sign * 0.14, 0.38),
    pt(sign * 0.34, 0.365),
    pt(sign * 0.52, 0.39),
    pt(sign * 0.56, 0.45),
    pt(sign * 0.50, 0.50),
    pt(sign * 0.28, 0.505),
    pt(sign * 0.14, 0.48),
    pt(sign * 0.11, 0.43)
  ];

  // Piriform Nasal Aperture cutout
  const nasalCavity: PointUV[] = [
    pt(0, 0.46),
    pt(0.055, 0.49),
    pt(0.095, 0.565),
    pt(0.07, 0.605),
    pt(0, 0.595),
    pt(-0.07, 0.605),
    pt(-0.095, 0.565),
    pt(-0.055, 0.49)
  ];

  // Temporal fossa / zygomatic arch undercuts
  const makeZygomaticGap = (sign: number): PointUV[] => [
    pt(sign * 0.63, 0.47),
    pt(sign * 0.78, 0.47),
    pt(sign * 0.77, 0.53),
    pt(sign * 0.63, 0.52)
  ];

  return {
    contours: [craniumOutline],
    cutouts: [makeOrbit(1), makeOrbit(-1), nasalCavity, makeZygomaticGap(1), makeZygomaticGap(-1)],
    trabecularZones: [
      makeOval(0, 0.18, 0.56, 0.12, 16), // cranial vault diploe
      makeOval(0.32, 0.35, 0.20, 0.035, 10), // supraorbital brow ridge
      makeOval(-0.32, 0.35, 0.20, 0.035, 10),
      makeOval(0.71, 0.59, 0.07, 0.045, 8),
      makeOval(-0.71, 0.59, 0.07, 0.045, 8)
    ],
    detailPaths: [
      // Sagittal suture
      [pt(0, 0.03), pt(-0.012, 0.08), pt(0.012, 0.13), pt(0, 0.18)],
      // Coronal suture across frontal/parietal junction
      [
        pt(-0.76, 0.25),
        pt(-0.52, 0.21),
        pt(-0.26, 0.19),
        pt(0, 0.18),
        pt(0.26, 0.19),
        pt(0.52, 0.21),
        pt(0.76, 0.25)
      ],
      // Supraorbital arch & glabella
      [
        pt(-0.58, 0.37),
        pt(-0.34, 0.345),
        pt(0, 0.365),
        pt(0.34, 0.345),
        pt(0.58, 0.37)
      ],
      // Nasal bridge & vomer septum
      [pt(0, 0.39), pt(0, 0.595)],
      [pt(-0.06, 0.45), pt(0, 0.43), pt(0.06, 0.45)],
      // Temporal lines
      [pt(0.56, 0.36), pt(0.68, 0.24), pt(0.62, 0.12)],
      [pt(-0.56, 0.36), pt(-0.68, 0.24), pt(-0.62, 0.12)]
    ]
  };
}

/**
 * Generates Maxilla with infraorbital margins, zygomatic processes, and upper teeth.
 */
export function buildMaxillaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.60, 0.51),
    pt(-0.36, 0.505),
    pt(-0.14, 0.50),
    pt(-0.09, 0.58),
    pt(0, 0.60),
    pt(0.09, 0.58),
    pt(0.14, 0.50),
    pt(0.36, 0.505),
    pt(0.60, 0.51),
    pt(0.64, 0.56),
    pt(0.49, 0.61),
    pt(0.45, 0.69),
    pt(0.28, 0.725),
    pt(0, 0.735),
    pt(-0.28, 0.725),
    pt(-0.45, 0.69),
    pt(-0.49, 0.61),
    pt(-0.64, 0.56)
  ];

  // Upper dental arcade tooth crowns
  const teeth: PointUV[][] = [];
  const toothPositions = [-0.34, -0.26, -0.18, -0.09, 0, 0.09, 0.18, 0.26, 0.34];
  for (let i = 0; i < toothPositions.length - 1; i++) {
    const u0 = toothPositions[i];
    const u1 = toothPositions[i + 1];
    const um = (u0 + u1) * 0.5;
    const vBase = 0.685 + (1 - Math.abs(um) * 2.2) * 0.015;
    teeth.push([
      pt(u0 + 0.01, vBase),
      pt(u0 + 0.01, vBase + 0.038),
      pt(u1 - 0.01, vBase + 0.038),
      pt(u1 - 0.01, vBase),
      pt(u0 + 0.01, vBase)
    ]);
  }

  return {
    contours: [contour],
    cutouts: [makeOval(0.28, 0.545, 0.032, 0.018, 8), makeOval(-0.28, 0.545, 0.032, 0.018, 8)],
    trabecularZones: [makeOval(0, 0.65, 0.38, 0.04, 14)],
    detailPaths: [
      [pt(0, 0.60), pt(0, 0.685)], // intermaxillary suture
      [pt(-0.40, 0.675), pt(0, 0.69), pt(0.40, 0.675)], // alveolar ridge
      ...teeth
    ]
  };
}

/**
 * Generates horseshoe Mandible with condylar/coronoid processes, mental foramina & lower teeth.
 */
export function buildMandibleGeometry(): BoneGeometrySpec {
  // Closed horseshoe tracing outer rim around condyles/ramus/chin and inner alveolar margin
  const contour: PointUV[] = [
    // Right condylar head -> outer ramus -> chin -> left outer ramus -> left condylar head
    pt(-0.74, 0.535),
    pt(-0.79, 0.56),
    pt(-0.77, 0.68),
    pt(-0.74, 0.79),
    pt(-0.66, 0.85),
    pt(-0.42, 0.92),
    pt(-0.18, 0.96),
    pt(0, 0.968),
    pt(0.18, 0.96),
    pt(0.42, 0.92),
    pt(0.66, 0.85),
    pt(0.74, 0.79),
    pt(0.77, 0.68),
    pt(0.79, 0.56),
    pt(0.74, 0.535),
    pt(0.70, 0.56),
    // Left mandibular notch -> coronoid process -> inner alveolar border
    pt(0.64, 0.595),
    pt(0.58, 0.535),
    pt(0.54, 0.61),
    pt(0.55, 0.73),
    pt(0.38, 0.795),
    pt(0.18, 0.825),
    pt(0, 0.832),
    pt(-0.18, 0.825),
    pt(-0.38, 0.795),
    pt(-0.55, 0.73),
    pt(-0.54, 0.61),
    pt(-0.58, 0.535),
    pt(-0.64, 0.595),
    pt(-0.70, 0.56)
  ];

  // Lower tooth crowns sitting along alveolar border
  const teeth: PointUV[][] = [];
  const toothPositions = [-0.34, -0.26, -0.18, -0.09, 0, 0.09, 0.18, 0.26, 0.34];
  for (let i = 0; i < toothPositions.length - 1; i++) {
    const u0 = toothPositions[i];
    const u1 = toothPositions[i + 1];
    const um = (u0 + u1) * 0.5;
    const vBase = 0.825 - Math.abs(um) * 0.08;
    teeth.push([
      pt(u0 + 0.01, vBase),
      pt(u0 + 0.01, vBase - 0.036),
      pt(u1 - 0.01, vBase - 0.036),
      pt(u1 - 0.01, vBase),
      pt(u0 + 0.01, vBase)
    ]);
  }

  return {
    contours: [contour],
    cutouts: [
      makeOval(0.28, 0.88, 0.025, 0.014, 8), // left mental foramen
      makeOval(-0.28, 0.88, 0.025, 0.014, 8) // right mental foramen
    ],
    trabecularZones: [
      makeOval(0, 0.90, 0.18, 0.04, 10),
      makeOval(0.72, 0.61, 0.055, 0.05, 8),
      makeOval(-0.72, 0.61, 0.055, 0.05, 8)
    ],
    cartilageZones: [
      makeOval(0.74, 0.525, 0.05, 0.016, 8), // TMJ articular discs
      makeOval(-0.74, 0.525, 0.05, 0.016, 8)
    ],
    detailPaths: [
      [pt(-0.14, 0.94), pt(0, 0.88), pt(0.14, 0.94)], // mental protuberance
      [pt(-0.68, 0.77), pt(-0.46, 0.84)], // oblique lines
      [pt(0.68, 0.77), pt(0.46, 0.84)],
      ...teeth
    ]
  };
}

/**
 * Generates Atlas (C1) & Axis (C2) with dens (odontoid process) and transverse foramina.
 */
export function buildAtlasAxisGeometry(): BoneGeometrySpec {
  const c1Atlas: PointUV[] = [
    pt(-0.20, 0.08),
    pt(0, 0.095),
    pt(0.20, 0.08),
    pt(0.44, 0.095),
    pt(0.46, 0.135),
    pt(0.36, 0.16),
    pt(0.18, 0.145),
    pt(0, 0.16),
    pt(-0.18, 0.145),
    pt(-0.36, 0.16),
    pt(-0.46, 0.135),
    pt(-0.44, 0.095)
  ];

  const c2Axis: PointUV[] = [
    pt(-0.075, 0.13),
    pt(-0.055, 0.05), // Dens (odontoid process) rising inside C1
    pt(0, 0.032),
    pt(0.055, 0.05),
    pt(0.075, 0.13),
    pt(0.22, 0.17),
    pt(0.36, 0.21),
    pt(0.34, 0.26),
    pt(0.20, 0.295),
    pt(0, 0.305),
    pt(-0.20, 0.295),
    pt(-0.34, 0.26),
    pt(-0.36, 0.21),
    pt(-0.22, 0.17)
  ];

  return {
    contours: [c1Atlas, c2Axis],
    cutouts: [
      makeOval(0.31, 0.125, 0.045, 0.018, 8),
      makeOval(-0.31, 0.125, 0.045, 0.018, 8)
    ],
    trabecularZones: [makeOval(0, 0.23, 0.15, 0.05, 10)],
    cartilageZones: [
      makeOval(0, 0.07, 0.16, 0.014, 10), // atlanto-occipital joint
      makeOval(0, 0.31, 0.17, 0.015, 10) // C2-C3 intervertebral disc
    ],
    detailPaths: [
      [pt(-0.04, 0.24), pt(-0.08, 0.295), pt(0, 0.275), pt(0.08, 0.295), pt(0.04, 0.24)] // bifid spinous
    ]
  };
}

/**
 * Generates S-curved Clavicle with sternal facet, conoid tubercle & acromial end.
 */
export function buildClavicleGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.075, 0.068),
    pt(0.14, 0.048),
    pt(0.28, 0.032), // medial convex anterior curve
    pt(0.46, 0.034),
    pt(0.64, 0.052), // lateral concave curve
    pt(0.79, 0.050),
    pt(0.88, 0.056), // acromial extremity
    pt(0.88, 0.086),
    pt(0.78, 0.088),
    pt(0.65, 0.082), // conoid tubercle hint
    pt(0.46, 0.062),
    pt(0.28, 0.060),
    pt(0.15, 0.084),
    pt(0.075, 0.102) // sternal extremity flare
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0.11, 0.08, 0.045, 0.022, 8),
      makeOval(0.83, 0.07, 0.05, 0.018, 8)
    ],
    cartilageZones: [
      makeOval(0.07, 0.085, 0.018, 0.022, 8), // SC joint disc
      makeOval(0.89, 0.072, 0.018, 0.018, 8) // AC joint disc
    ],
    detailPaths: [
      [pt(0.14, 0.070), pt(0.32, 0.047), pt(0.56, 0.056), pt(0.80, 0.068)] // cortical axis
    ]
  };
}

/**
 * Generates Sternum (Manubrium with jugular notch, Body with costal notches, Xiphoid).
 */
export function buildSternumGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    // Manubrium top with jugular notch
    pt(-0.105, 0.072),
    pt(-0.045, 0.088),
    pt(0, 0.094), // jugular notch
    pt(0.045, 0.088),
    pt(0.105, 0.072),
    // Manubrium lateral border & 1st costal notch
    pt(0.115, 0.115),
    pt(0.082, 0.155),
    pt(0.065, 0.172), // Sternal angle (Angle of Louis)
    // Gladiolus (body) with scalloped costal notches
    pt(0.076, 0.205),
    pt(0.062, 0.222),
    pt(0.078, 0.254),
    pt(0.064, 0.272),
    pt(0.076, 0.305),
    pt(0.060, 0.324),
    pt(0.066, 0.354),
    pt(0.048, 0.375),
    // Xiphoid process
    pt(0.032, 0.395),
    pt(0.018, 0.435),
    pt(0, 0.452),
    pt(-0.018, 0.435),
    pt(-0.032, 0.395),
    // Left side mirrored
    pt(-0.048, 0.375),
    pt(-0.066, 0.354),
    pt(-0.060, 0.324),
    pt(-0.076, 0.305),
    pt(-0.064, 0.272),
    pt(-0.078, 0.254),
    pt(-0.062, 0.222),
    pt(-0.076, 0.205),
    pt(-0.065, 0.172),
    pt(-0.082, 0.155),
    pt(-0.115, 0.115)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0, 0.125, 0.072, 0.036, 10),
      makeOval(0, 0.27, 0.048, 0.085, 12)
    ],
    cartilageZones: [
      makeOval(0, 0.172, 0.058, 0.008, 8), // manubriosternal joint
      makeOval(0, 0.382, 0.038, 0.007, 8) // xiphisternal joint
    ],
    detailPaths: [
      [pt(-0.062, 0.172), pt(0.062, 0.172)], // Angle of Louis
      [pt(-0.056, 0.235), pt(0.056, 0.235)], // sternebrae lines
      [pt(-0.056, 0.295), pt(0.056, 0.295)],
      [pt(-0.048, 0.345), pt(0.048, 0.345)]
    ]
  };
}

/**
 * Generates detailed Scapula with spine, acromion, coracoid process, and glenoid socket.
 */
export function buildScapulaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.39, 0.135), // superior medial angle
    pt(0.54, 0.122), // superior border
    pt(0.64, 0.138), // suprascapular notch
    pt(0.71, 0.105), // coracoid process tip
    pt(0.76, 0.120),
    pt(0.74, 0.145),
    pt(0.84, 0.095), // acromion lateral sweep
    pt(0.91, 0.098),
    pt(0.92, 0.130),
    pt(0.84, 0.160), // spinoglenoid neck
    pt(0.87, 0.190), // glenoid cavity rim
    pt(0.85, 0.235),
    pt(0.78, 0.255), // lateral (axillary) border
    pt(0.70, 0.325),
    pt(0.62, 0.388), // inferior angle
    pt(0.56, 0.392),
    pt(0.50, 0.355),
    pt(0.43, 0.285), // medial (vertebral) border
    pt(0.38, 0.210), // root of scapular spine
    pt(0.37, 0.165)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0.83, 0.195, 0.045, 0.045, 10),
      makeOval(0.87, 0.115, 0.045, 0.022, 8),
      makeOval(0.59, 0.365, 0.05, 0.028, 8)
    ],
    cartilageZones: [
      makeOval(0.87, 0.205, 0.022, 0.036, 10) // glenoid labrum
    ],
    detailPaths: [
      // Prominent raised Spina scapulae (crest of spine -> acromion)
      [
        pt(0.39, 0.198),
        pt(0.54, 0.175),
        pt(0.70, 0.152),
        pt(0.82, 0.125),
        pt(0.90, 0.114)
      ],
      [
        pt(0.40, 0.214),
        pt(0.56, 0.192),
        pt(0.72, 0.168),
        pt(0.84, 0.142)
      ],
      // Subscapular / infraspinous fossa muscular ridges
      [pt(0.47, 0.255), pt(0.64, 0.335)],
      [pt(0.54, 0.235), pt(0.69, 0.295)]
    ]
  };
}

/**
 * Generates anatomical Humerus with spherical head, greater/lesser tubercles,
 * deltoid tuberosity, supracondylar ridges, epicondyles, trochlea & capitulum.
 */
export function buildHumerusGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    // Proximal: greater tubercle -> humeral head -> anatomical neck
    pt(0.06, 0.018),
    pt(0.18, 0.042), // greater tubercle
    pt(0.22, 0.095),
    pt(0.14, 0.165), // surgical neck lateral
    pt(0.12, 0.320),
    pt(0.145, 0.400), // deltoid tuberosity bulge
    pt(0.11, 0.490),
    pt(0.105, 0.680),
    pt(0.165, 0.810), // lateral supracondylar ridge
    pt(0.235, 0.885), // lateral epicondyle
    pt(0.20, 0.945),
    pt(0.13, 0.972), // capitulum
    pt(0.04, 0.960),
    pt(-0.04, 0.976), // trochlea
    pt(-0.14, 0.968),
    pt(-0.24, 0.910), // medial epicondyle (more prominent!)
    pt(-0.22, 0.855),
    pt(-0.14, 0.785), // medial supracondylar ridge
    pt(-0.095, 0.640),
    pt(-0.095, 0.340),
    pt(-0.105, 0.175), // surgical neck medial
    pt(-0.19, 0.125), // humeral head medial arc
    pt(-0.22, 0.068),
    pt(-0.16, 0.022),
    pt(-0.05, 0.010)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(-0.04, 0.075, 0.16, 0.062, 14),
      makeOval(0, 0.91, 0.17, 0.052, 12)
    ],
    cartilageZones: [
      makeOval(-0.14, 0.055, 0.085, 0.045, 10, -0.35), // humeral head articular cartilage
      makeOval(0.02, 0.966, 0.15, 0.015, 10) // distal trochlea/capitulum cartilage
    ],
    detailPaths: [
      // Intertubercular (bicipital) groove
      [pt(0.04, 0.04), pt(0.03, 0.18)],
      // Medullary cavity walls
      [pt(-0.04, 0.22), pt(-0.04, 0.76)],
      [pt(0.045, 0.22), pt(0.045, 0.76)],
      // Olecranon/coronoid fossa outline
      [pt(-0.08, 0.875), pt(0, 0.845), pt(0.08, 0.875), pt(0, 0.91), pt(-0.08, 0.875)]
    ]
  };
}

export function buildHumeralEpicondylesGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.13, 0.845),
    pt(0, 0.86),
    pt(0.13, 0.845),
    pt(0.24, 0.905),
    pt(0.21, 0.955),
    pt(0.12, 0.975),
    pt(0, 0.962),
    pt(-0.12, 0.978),
    pt(-0.25, 0.925),
    pt(-0.24, 0.875)
  ];
  return {
    contours: [contour],
    trabecularZones: [makeOval(0, 0.915, 0.18, 0.045, 12)],
    detailPaths: [
      [pt(-0.08, 0.89), pt(0, 0.865), pt(0.08, 0.89), pt(0, 0.925), pt(-0.08, 0.89)]
    ]
  };
}

/**
 * Generates anatomical Radius (lateral forearm bone).
 */
export function buildRadiusGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.04, 0.050), // radial head
    pt(0.13, 0.044),
    pt(0.22, 0.052),
    pt(0.21, 0.082),
    pt(0.17, 0.102), // radial neck
    pt(0.18, 0.200),
    pt(0.22, 0.450), // lateral diaphyseal bow
    pt(0.21, 0.720),
    pt(0.26, 0.880), // distal flare
    pt(0.285, 0.965), // radial styloid process
    pt(0.22, 0.972),
    pt(0.11, 0.955), // carpal articular surface
    pt(0.03, 0.945),
    pt(0.045, 0.860),
    pt(0.095, 0.680),
    pt(0.105, 0.420), // interosseous crest
    pt(0.04, 0.175), // radial tuberosity
    pt(0.08, 0.115),
    pt(0.04, 0.082)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0.13, 0.066, 0.07, 0.022, 10),
      makeOval(0.15, 0.92, 0.095, 0.038, 10)
    ],
    cartilageZones: [
      makeOval(0.13, 0.044, 0.075, 0.009, 8),
      makeOval(0.14, 0.962, 0.10, 0.012, 8)
    ],
    detailPaths: [
      [pt(0.135, 0.21), pt(0.155, 0.48), pt(0.135, 0.82)],
      [pt(0.175, 0.21), pt(0.195, 0.48), pt(0.195, 0.82)]
    ]
  };
}

/**
 * Generates anatomical Ulna (medial forearm bone with olecranon hook & styloid).
 */
export function buildUlnaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.21, -0.015), // olecranon process
    pt(-0.12, -0.022),
    pt(-0.04, -0.005),
    pt(-0.05, 0.065), // trochlear notch
    pt(-0.02, 0.115), // coronoid process
    pt(-0.07, 0.175),
    pt(-0.09, 0.420),
    pt(-0.10, 0.720),
    pt(-0.08, 0.920), // distal ulnar head
    pt(-0.12, 0.958),
    pt(-0.19, 0.972), // ulnar styloid process
    pt(-0.21, 0.925),
    pt(-0.19, 0.740),
    pt(-0.20, 0.450),
    pt(-0.22, 0.160),
    pt(-0.23, 0.050)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(-0.13, 0.045, 0.075, 0.045, 10),
      makeOval(-0.14, 0.935, 0.05, 0.022, 8)
    ],
    cartilageZones: [
      makeOval(-0.09, 0.04, 0.05, 0.02, 8),
      makeOval(-0.14, 0.962, 0.055, 0.01, 8)
    ],
    detailPaths: [
      [pt(-0.13, 0.19), pt(-0.135, 0.50), pt(-0.13, 0.84)],
      [pt(-0.17, 0.19), pt(-0.175, 0.50), pt(-0.17, 0.84)]
    ]
  };
}

/**
 * Generates 8 articulated carpal bones in proximal and distal rows.
 */
export function buildCarpalsGeometry(): BoneGeometrySpec {
  // Proximal row (scaphoid, lunate, triquetrum, pisiform) & distal row (trapezium, trapezoid, capitate, hamate)
  const carpals: PointUV[][] = [
    makeOval(0.23, 0.065, 0.08, 0.042, 10, -0.3), // Scaphoid
    makeOval(0.07, 0.055, 0.072, 0.036, 10), // Lunate
    makeOval(-0.09, 0.062, 0.068, 0.035, 10, 0.2), // Triquetrum
    makeOval(-0.19, 0.082, 0.045, 0.028, 8), // Pisiform
    makeOval(0.28, 0.145, 0.075, 0.04, 10, -0.2), // Trapezium
    makeOval(0.15, 0.148, 0.058, 0.036, 10), // Trapezoid
    makeOval(0.01, 0.138, 0.075, 0.048, 10), // Capitate
    makeOval(-0.14, 0.142, 0.072, 0.042, 10) // Hamate
  ];
  return {
    contours: carpals,
    trabecularZones: carpals.map((c) => c),
    cartilageZones: [makeOval(0.04, 0.098, 0.30, 0.012, 14)]
  };
}

/**
 * Generates 5 diverging metacarpal bones with bases, concave shafts & knuckle heads.
 */
export function buildMetacarpalsGeometry(): BoneGeometrySpec {
  const rays: { u0: number; v0: number; u1: number; v1: number; w: number }[] = [
    { u0: 0.29, v0: 0.20, u1: 0.42, v1: 0.45, w: 0.046 }, // Thumb MC1 (abducted)
    { u0: 0.16, v0: 0.20, u1: 0.21, v1: 0.54, w: 0.038 }, // Index MC2
    { u0: 0.02, v0: 0.195, u1: 0.03, v1: 0.555, w: 0.040 }, // Middle MC3
    { u0: -0.10, v0: 0.20, u1: -0.13, v1: 0.53, w: 0.036 }, // Ring MC4
    { u0: -0.21, v0: 0.205, u1: -0.27, v1: 0.505, w: 0.035 } // Pinky MC5
  ];

  const contours: PointUV[][] = [];
  const trabecularZones: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  for (const ray of rays) {
    const du = ray.u1 - ray.u0;
    const dv = ray.v1 - ray.v0;
    const len = Math.hypot(du, dv);
    const nx = -dv / len;
    const ny = du / len;

    const pAt = (t: number, lat: number): PointUV =>
      pt(ray.u0 + du * t + nx * lat, ray.v0 + dv * t + ny * lat);

    contours.push([
      pAt(0.0, -ray.w * 1.15),
      pAt(0.0, ray.w * 1.15),
      pAt(0.2, ray.w * 0.85),
      pAt(0.55, ray.w * 0.65),
      pAt(0.84, ray.w * 0.88),
      pAt(0.95, ray.w * 1.15),
      pAt(1.01, ray.w * 0.6),
      pAt(1.02, -ray.w * 0.6),
      pAt(0.95, -ray.w * 1.15),
      pAt(0.84, -ray.w * 0.88),
      pAt(0.55, -ray.w * 0.65),
      pAt(0.2, -ray.w * 0.85)
    ]);

    trabecularZones.push(makeOval(ray.u1, ray.v1 - dv * 0.08, ray.w * 0.9, 0.028, 8));
    cartilageZones.push(makeOval(ray.u1, ray.v1 + 0.008, ray.w * 0.85, 0.011, 8));
    detailPaths.push([pAt(0.2, 0), pAt(0.82, 0)]);
  }

  return { contours, trabecularZones, cartilageZones, detailPaths };
}

/**
 * Generates 14 segmented hand phalanges (proximal, middle, distal).
 */
export function buildHandPhalangesGeometry(): BoneGeometrySpec {
  const fingers: { u0: number; v0: number; u1: number; v1: number; segments: readonly number[]; w: number }[] = [
    { u0: 0.43, v0: 0.47, u1: 0.51, v1: 0.72, segments: [0.52, 0.42], w: 0.036 }, // Thumb (2)
    { u0: 0.215, v0: 0.56, u1: 0.24, v1: 0.91, segments: [0.44, 0.30, 0.22], w: 0.032 }, // Index (3)
    { u0: 0.03, v0: 0.575, u1: 0.035, v1: 0.97, segments: [0.44, 0.30, 0.22], w: 0.034 }, // Middle (3)
    { u0: -0.135, v0: 0.55, u1: -0.155, v1: 0.92, segments: [0.44, 0.30, 0.22], w: 0.031 }, // Ring (3)
    { u0: -0.275, v0: 0.525, u1: -0.31, v1: 0.84, segments: [0.44, 0.30, 0.22], w: 0.028 } // Pinky (3)
  ];

  const contours: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  for (const f of fingers) {
    const du = f.u1 - f.u0;
    const dv = f.v1 - f.v0;
    const len = Math.hypot(du, dv);
    const nx = -dv / len;
    const ny = du / len;

    let tCursor = 0;
    for (let s = 0; s < f.segments.length; s++) {
      const segFrac = f.segments[s];
      const t0 = tCursor + 0.02;
      const t1 = tCursor + segFrac - 0.025;
      tCursor += segFrac;
      const wScale = 1 - s * 0.16;
      const w = f.w * wScale;
      const isDistal = s === f.segments.length - 1;

      const pAt = (t: number, lat: number): PointUV =>
        pt(f.u0 + du * t + nx * lat, f.v0 + dv * t + ny * lat);

      contours.push([
        pAt(t0, -w * 1.05),
        pAt(t0, w * 1.05),
        pAt((t0 + t1) * 0.5, w * 0.65),
        pAt(t1 - 0.02, isDistal ? w * 0.9 : w * 0.85),
        pAt(t1, isDistal ? w * 0.65 : w * 0.85),
        pAt(t1 + 0.01, 0),
        pAt(t1, isDistal ? -w * 0.65 : -w * 0.85),
        pAt(t1 - 0.02, isDistal ? -w * 0.9 : -w * 0.85),
        pAt((t0 + t1) * 0.5, -w * 0.65)
      ]);

      detailPaths.push([pAt(t0 + 0.02, 0), pAt(t1 - 0.02, 0)]);
      if (!isDistal) {
        cartilageZones.push(
          makeOval(f.u0 + du * tCursor, f.v0 + dv * tCursor, w * 0.8, 0.009, 6)
        );
      }
    }
  }

  return { contours, cartilageZones, detailPaths };
}

/**
 * Generates Ilium (wing, iliac crest, ASIS, AIIS, PSIS, sciatic notch & acetabular roof).
 */
export function buildIliumGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.22, 0.14), // PSIS
    pt(0.38, 0.075), // Iliac crest peak
    pt(0.58, 0.062),
    pt(0.76, 0.095),
    pt(0.89, 0.215), // ASIS
    pt(0.85, 0.275),
    pt(0.78, 0.345), // AIIS
    pt(0.74, 0.420),
    pt(0.72, 0.505), // lateral acetabular rim
    pt(0.62, 0.555), // acetabular notch
    pt(0.50, 0.505),
    pt(0.41, 0.435), // greater sciatic notch
    pt(0.30, 0.440),
    pt(0.22, 0.365), // PIIS
    pt(0.19, 0.235) // sacroiliac auricular region
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0.56, 0.15, 0.24, 0.07, 12, 0.12), // iliac crest & ala
      makeOval(0.63, 0.49, 0.09, 0.055, 10) // acetabular dome
    ],
    cartilageZones: [
      makeOval(0.63, 0.525, 0.085, 0.032, 10) // acetabular labrum
    ],
    detailPaths: [
      // Iliac crest thickened cortical lip
      [pt(0.24, 0.15), pt(0.44, 0.095), pt(0.66, 0.092), pt(0.85, 0.21)],
      // Arcuate / gluteal lines
      [pt(0.26, 0.31), pt(0.48, 0.29), pt(0.73, 0.35)],
      [pt(0.34, 0.38), pt(0.54, 0.38), pt(0.72, 0.43)]
    ]
  };
}

/**
 * Generates Ischium (acetabular floor, ischial spine, rugged tuberosity & ramus).
 */
export function buildIschiumGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.49, 0.50), // superior acetabular junction
    pt(0.64, 0.54),
    pt(0.62, 0.64),
    pt(0.54, 0.76),
    pt(0.46, 0.89), // ischial tuberosity inferior
    pt(0.34, 0.91),
    pt(0.24, 0.83), // ischiopubic ramus
    pt(0.28, 0.76),
    pt(0.38, 0.79), // inner obturator margin
    pt(0.44, 0.69),
    pt(0.34, 0.64), // ischial spine!
    pt(0.33, 0.59),
    pt(0.43, 0.55)
  ];

  return {
    contours: [contour],
    trabecularZones: [makeOval(0.39, 0.83, 0.10, 0.065, 10)],
    detailPaths: [
      [pt(0.36, 0.86), pt(0.46, 0.84), pt(0.54, 0.72)]
    ]
  };
}

/**
 * Generates Pubis with bilateral superior/inferior rami, pubic symphysis & true obturator foramina.
 */
export function buildPubisGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.56, 0.53), // right acetabular junction
    pt(-0.34, 0.58), // superior pubic ramus
    pt(-0.14, 0.61), // pubic tubercle
    pt(-0.03, 0.62),
    pt(0.03, 0.62),
    pt(0.14, 0.61),
    pt(0.34, 0.58),
    pt(0.56, 0.53), // left acetabular junction
    pt(0.58, 0.65),
    pt(0.50, 0.82), // ischiopubic junction
    pt(0.38, 0.87),
    pt(0.20, 0.80), // pubic arch
    pt(0.06, 0.78),
    pt(0, 0.76),
    pt(-0.06, 0.78),
    pt(-0.20, 0.80),
    pt(-0.38, 0.87),
    pt(-0.50, 0.82),
    pt(-0.58, 0.65)
  ];

  return {
    contours: [contour],
    cutouts: [
      makeOval(0.34, 0.70, 0.135, 0.085, 14, -0.25), // left obturator foramen
      makeOval(-0.34, 0.70, 0.135, 0.085, 14, 0.25) // right obturator foramen
    ],
    trabecularZones: [
      makeOval(0.09, 0.69, 0.065, 0.065, 8),
      makeOval(-0.09, 0.69, 0.065, 0.065, 8)
    ],
    cartilageZones: [
      makeOval(0, 0.695, 0.028, 0.078, 10) // fibrocartilaginous pubic symphysis
    ],
    detailPaths: [
      [pt(-0.46, 0.58), pt(-0.12, 0.635)], // pectineal lines
      [pt(0.46, 0.58), pt(0.12, 0.635)]
    ]
  };
}

/**
 * Generates Sacrum & Coccyx with sacral alae, 4 pairs of sacral foramina & SI joints.
 */
export function buildSacrumGeometry(): BoneGeometrySpec {
  const sacrum: PointUV[] = [
    pt(-0.14, 0.15), // promontory
    pt(0, 0.165),
    pt(0.14, 0.15),
    pt(0.28, 0.19), // sacral ala
    pt(0.26, 0.34), // auricular SI margin
    pt(0.21, 0.49),
    pt(0.14, 0.63),
    pt(0.06, 0.71), // sacral apex
    pt(-0.06, 0.71),
    pt(-0.14, 0.63),
    pt(-0.21, 0.49),
    pt(-0.26, 0.34),
    pt(-0.28, 0.19)
  ];

  const coccyx1 = makeOval(0, 0.745, 0.048, 0.025, 8);
  const coccyx2 = makeOval(0, 0.795, 0.036, 0.022, 8);
  const coccyx3 = makeOval(0, 0.838, 0.022, 0.018, 8);

  // 4 pairs of pelvic/dorsal sacral foramina
  const foramina: PointUV[][] = [];
  const fRows = [
    { v: 0.28, u: 0.115, r: 0.024 },
    { v: 0.39, u: 0.100, r: 0.022 },
    { v: 0.50, u: 0.082, r: 0.019 },
    { v: 0.60, u: 0.064, r: 0.016 }
  ];
  for (const row of fRows) {
    foramina.push(makeOval(row.u, row.v, row.r, row.r * 1.15, 8));
    foramina.push(makeOval(-row.u, row.v, row.r, row.r * 1.15, 8));
  }

  return {
    contours: [sacrum, coccyx1, coccyx2, coccyx3],
    cutouts: foramina,
    trabecularZones: [makeOval(0, 0.35, 0.16, 0.16, 12)],
    cartilageZones: [
      makeOval(0, 0.15, 0.125, 0.016, 10), // L5-S1 disc
      [pt(0.25, 0.21), pt(0.28, 0.22), pt(0.24, 0.44), pt(0.21, 0.43)], // SI joints
      [pt(-0.25, 0.21), pt(-0.28, 0.22), pt(-0.24, 0.44), pt(-0.21, 0.43)]
    ],
    detailPaths: [
      [pt(0, 0.20), pt(0, 0.69)], // median sacral crest
      [pt(-0.15, 0.33), pt(0.15, 0.33)], // transverse fusion lines
      [pt(-0.13, 0.44), pt(0.13, 0.44)],
      [pt(-0.10, 0.55), pt(0.10, 0.55)]
    ]
  };
}

export function buildGreaterTrochanterGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.76, 0.47),
    pt(0.89, 0.49),
    pt(0.95, 0.57),
    pt(0.92, 0.66),
    pt(0.82, 0.70),
    pt(0.73, 0.62),
    pt(0.72, 0.53)
  ];
  return {
    contours: [contour],
    trabecularZones: [makeOval(0.83, 0.58, 0.085, 0.075, 10)],
    detailPaths: [
      [pt(0.77, 0.52), pt(0.88, 0.59), pt(0.80, 0.66)] // intertrochanteric crest facet
    ]
  };
}

/**
 * Generates anatomical Femur (head, angled neck, greater/lesser trochanters,
 * bowed shaft, flared epicondyles & medial/lateral condyles with intercondylar notch).
 */
export function buildFemurGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    // Femoral head (medial) -> superior neck -> greater trochanter (lateral)
    pt(-0.25, 0.015),
    pt(-0.17, -0.022),
    pt(-0.09, 0.005),
    pt(-0.04, 0.052), // superior neck
    pt(0.06, 0.062),
    pt(0.14, 0.032), // greater trochanter apex
    pt(0.22, 0.065),
    pt(0.21, 0.145),
    pt(0.14, 0.240), // lateral shaft
    pt(0.11, 0.460),
    pt(0.10, 0.680),
    pt(0.16, 0.820),
    pt(0.23, 0.895), // lateral epicondyle
    pt(0.21, 0.960), // lateral condyle
    pt(0.12, 0.985),
    pt(0.03, 0.962),
    pt(0.0, 0.925), // intercondylar notch!
    pt(-0.03, 0.962),
    pt(-0.12, 0.988), // medial condyle
    pt(-0.21, 0.962),
    pt(-0.24, 0.895), // medial epicondyle
    pt(-0.15, 0.810),
    pt(-0.07, 0.640),
    pt(-0.06, 0.420),
    pt(-0.06, 0.240),
    pt(-0.14, 0.195), // lesser trochanter!
    pt(-0.08, 0.145),
    pt(-0.14, 0.095), // inferior neck
    pt(-0.23, 0.072)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(-0.16, 0.03, 0.078, 0.042, 12), // femoral head trabeculae
      makeOval(0.12, 0.10, 0.075, 0.055, 10), // trochanteric trabeculae
      makeOval(0, 0.92, 0.18, 0.05, 12) // distal condylar trabeculae
    ],
    cartilageZones: [
      makeOval(-0.18, 0.025, 0.075, 0.038, 10, -0.3), // hip articular cartilage
      makeOval(-0.12, 0.975, 0.07, 0.014, 8), // medial condyle cartilage
      makeOval(0.12, 0.975, 0.07, 0.014, 8) // lateral condyle cartilage
    ],
    detailPaths: [
      // Primary compressive/tensile femoral neck trabecular arc
      [pt(-0.19, 0.025), pt(-0.05, 0.075), pt(0.04, 0.155)],
      [pt(0.14, 0.07), pt(0.04, 0.145), pt(-0.09, 0.185)],
      // Medullary cavity walls along diaphysis
      [pt(-0.01, 0.23), pt(0.0, 0.52), pt(-0.02, 0.80)],
      [pt(0.065, 0.23), pt(0.06, 0.52), pt(0.07, 0.80)],
      // Patellar trochlear groove
      [pt(-0.05, 0.89), pt(0, 0.915), pt(0.05, 0.89)]
    ]
  };
}

export function buildPatellaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.11, 0.918),
    pt(0, 0.905), // broad superior base
    pt(0.11, 0.918),
    pt(0.14, 0.955),
    pt(0.08, 0.992),
    pt(0, 1.012), // pointed inferior apex
    pt(-0.08, 0.992),
    pt(-0.14, 0.955)
  ];
  return {
    contours: [contour],
    trabecularZones: [makeOval(0, 0.955, 0.09, 0.036, 10)],
    detailPaths: [
      [pt(0, 0.918), pt(0, 0.995)], // vertical median ridge
      [pt(-0.09, 0.945), pt(0.09, 0.945)]
    ]
  };
}

/**
 * Generates anatomical Tibia (tibial plateau, tibial tuberosity, anterior crest, medial malleolus).
 */
export function buildTibiaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.24, 0.022), // medial tibial condyle
    pt(-0.09, 0.012),
    pt(-0.05, -0.002), // intercondylar eminence!
    pt(0.01, 0.012),
    pt(0.14, 0.024), // lateral tibial condyle
    pt(0.15, 0.072),
    pt(0.04, 0.135),
    pt(0.015, 0.340),
    pt(0.015, 0.680),
    pt(0.055, 0.875),
    pt(0.075, 0.945), // distal tibial plafond
    pt(-0.08, 0.952),
    pt(-0.14, 0.998), // medial malleolus!
    pt(-0.21, 0.985),
    pt(-0.21, 0.900),
    pt(-0.145, 0.720),
    pt(-0.140, 0.400),
    pt(-0.165, 0.145),
    pt(-0.25, 0.075)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(-0.05, 0.055, 0.16, 0.042, 12),
      makeOval(-0.07, 0.935, 0.10, 0.038, 10)
    ],
    cartilageZones: [
      makeOval(-0.15, 0.018, 0.08, 0.009, 8), // knee menisci / plateau cartilage
      makeOval(0.05, 0.018, 0.08, 0.009, 8),
      makeOval(-0.02, 0.955, 0.09, 0.012, 8) // tibiotalar cartilage
    ],
    detailPaths: [
      // Tibial tuberosity + S-curved anterior shin crest (margo anterior)
      [pt(-0.05, 0.115), pt(-0.035, 0.155), pt(-0.075, 0.45), pt(-0.06, 0.82)],
      // Medullary cavity walls
      [pt(-0.10, 0.18), pt(-0.10, 0.82)],
      [pt(-0.02, 0.18), pt(-0.02, 0.82)]
    ]
  };
}

/**
 * Generates anatomical Fibula (diamond fibular head, slender shaft, lateral malleolus).
 */
export function buildFibulaGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(0.20, 0.042), // styloid apex of fibular head
    pt(0.28, 0.068),
    pt(0.27, 0.112),
    pt(0.23, 0.145), // fibular neck
    pt(0.24, 0.480),
    pt(0.245, 0.820),
    pt(0.285, 0.925), // lateral malleolus flare
    pt(0.265, 1.005), // distal tip (extends lower than medial malleolus)
    pt(0.20, 1.015),
    pt(0.15, 0.945),
    pt(0.17, 0.820),
    pt(0.17, 0.480),
    pt(0.165, 0.145),
    pt(0.135, 0.095)
  ];

  return {
    contours: [contour],
    trabecularZones: [
      makeOval(0.21, 0.085, 0.055, 0.03, 8),
      makeOval(0.22, 0.96, 0.05, 0.036, 8)
    ],
    detailPaths: [
      [pt(0.205, 0.16), pt(0.205, 0.86)]
    ]
  };
}

/**
 * Generates Foot bones: Talus, Calcaneus, Tarsals & Metatarsals, and 14 Phalanges.
 */
export function buildTalusGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.16, 0.06),
    pt(0, 0.03), // trochlear dome
    pt(0.16, 0.06),
    pt(0.22, 0.13),
    pt(0.18, 0.21), // talar neck & head
    pt(0.06, 0.27),
    pt(-0.12, 0.26),
    pt(-0.22, 0.18),
    pt(-0.21, 0.11)
  ];
  return {
    contours: [contour],
    trabecularZones: [makeOval(0, 0.145, 0.16, 0.08, 10)],
    cartilageZones: [makeOval(0, 0.055, 0.14, 0.02, 10)]
  };
}

export function buildCalcaneusGeometry(): BoneGeometrySpec {
  const contour: PointUV[] = [
    pt(-0.18, 0.10), // posterior calcaneal tuberosity
    pt(0, 0.07),
    pt(0.18, 0.10),
    pt(0.27, 0.20),
    pt(0.24, 0.34), // anterior cuboid process
    pt(0.08, 0.39),
    pt(-0.10, 0.38),
    pt(-0.24, 0.32), // sustentaculum tali shelf
    pt(-0.26, 0.20)
  ];
  return {
    contours: [contour],
    trabecularZones: [makeOval(0, 0.23, 0.20, 0.10, 12)],
    detailPaths: [
      [pt(-0.18, 0.25), pt(0, 0.18), pt(0.18, 0.26)] // calcaneal trabecular truss
    ]
  };
}

export function buildTarsalsMetatarsalsGeometry(): BoneGeometrySpec {
  const contours: PointUV[][] = [
    // Midfoot tarsals: Navicular, Cuboid, 3 Cuneiforms
    makeOval(-0.10, 0.28, 0.14, 0.042, 10), // Navicular
    makeOval(0.19, 0.32, 0.10, 0.055, 10), // Cuboid
    makeOval(-0.20, 0.36, 0.075, 0.04, 8), // Medial cuneiform
    makeOval(-0.07, 0.355, 0.055, 0.036, 8), // Intermediate cuneiform
    makeOval(0.05, 0.355, 0.058, 0.038, 8) // Lateral cuneiform
  ];

  // 5 Metatarsals (medial hallux MT1 at u < 0, lateral MT5 at u > 0)
  const mts: { u0: number; v0: number; u1: number; v1: number; w: number }[] = [
    { u0: -0.22, v0: 0.40, u1: -0.25, v1: 0.66, w: 0.055 }, // MT1 (thickest)
    { u0: -0.09, v0: 0.39, u1: -0.10, v1: 0.68, w: 0.036 }, // MT2
    { u0: 0.03, v0: 0.395, u1: 0.04, v1: 0.67, w: 0.035 }, // MT3
    { u0: 0.14, v0: 0.40, u1: 0.17, v1: 0.65, w: 0.034 }, // MT4
    { u0: 0.24, v0: 0.40, u1: 0.29, v1: 0.63, w: 0.038 } // MT5
  ];

  const trabecularZones: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  for (const mt of mts) {
    const du = mt.u1 - mt.u0;
    const dv = mt.v1 - mt.v0;
    const len = Math.hypot(du, dv);
    const nx = -dv / len;
    const ny = du / len;
    const pAt = (t: number, lat: number): PointUV =>
      pt(mt.u0 + du * t + nx * lat, mt.v0 + dv * t + ny * lat);

    contours.push([
      pAt(0, -mt.w * 1.1),
      pAt(0, mt.w * 1.1),
      pAt(0.25, mt.w * 0.72),
      pAt(0.65, mt.w * 0.66),
      pAt(0.92, mt.w * 1.08),
      pAt(1.01, mt.w * 0.55),
      pAt(1.01, -mt.w * 0.55),
      pAt(0.92, -mt.w * 1.08),
      pAt(0.65, -mt.w * 0.66),
      pAt(0.25, -mt.w * 0.72)
    ]);

    trabecularZones.push(makeOval(mt.u1, mt.v1 - dv * 0.1, mt.w * 0.85, 0.025, 8));
    cartilageZones.push(makeOval(mt.u1, mt.v1 + 0.01, mt.w * 0.85, 0.01, 8));
    detailPaths.push([pAt(0.2, 0), pAt(0.82, 0)]);
  }

  return { contours, trabecularZones, cartilageZones, detailPaths };
}

export function buildFootPhalangesGeometry(): BoneGeometrySpec {
  const toes: { u0: number; v0: number; u1: number; v1: number; segments: readonly number[]; w: number }[] = [
    { u0: -0.255, v0: 0.68, u1: -0.28, v1: 0.97, segments: [0.54, 0.44], w: 0.048 }, // Hallux (2)
    { u0: -0.10, v0: 0.70, u1: -0.11, v1: 0.96, segments: [0.46, 0.28, 0.22], w: 0.032 }, // Toe 2
    { u0: 0.04, v0: 0.69, u1: 0.045, v1: 0.94, segments: [0.46, 0.28, 0.22], w: 0.030 }, // Toe 3
    { u0: 0.17, v0: 0.67, u1: 0.185, v1: 0.91, segments: [0.46, 0.28, 0.22], w: 0.028 }, // Toe 4
    { u0: 0.29, v0: 0.65, u1: 0.32, v1: 0.87, segments: [0.48, 0.26, 0.22], w: 0.026 } // Toe 5
  ];

  const contours: PointUV[][] = [];
  const cartilageZones: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  for (const toe of toes) {
    const du = toe.u1 - toe.u0;
    const dv = toe.v1 - toe.v0;
    const len = Math.hypot(du, dv);
    const nx = -dv / len;
    const ny = du / len;

    let tCursor = 0;
    for (let s = 0; s < toe.segments.length; s++) {
      const segFrac = toe.segments[s];
      const t0 = tCursor + 0.02;
      const t1 = tCursor + segFrac - 0.03;
      tCursor += segFrac;
      const w = toe.w * (1 - s * 0.16);
      const isDistal = s === toe.segments.length - 1;

      const pAt = (t: number, lat: number): PointUV =>
        pt(toe.u0 + du * t + nx * lat, toe.v0 + dv * t + ny * lat);

      contours.push([
        pAt(t0, -w),
        pAt(t0, w),
        pAt((t0 + t1) * 0.5, w * 0.7),
        pAt(t1, w * 0.85),
        pAt(t1 + 0.02, 0),
        pAt(t1, -w * 0.85),
        pAt((t0 + t1) * 0.5, -w * 0.7)
      ]);
      detailPaths.push([pAt(t0 + 0.02, 0), pAt(t1 - 0.02, 0)]);
      if (!isDistal) {
        cartilageZones.push(
          makeOval(toe.u0 + du * tCursor, toe.v0 + dv * tCursor, w * 0.75, 0.008, 6)
        );
      }
    }
  }

  return { contours, cartilageZones, detailPaths };
}
