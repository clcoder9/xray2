import {
  buildAtlasAxisGeometry,
  buildCalcaneusGeometry,
  buildCarpalsGeometry,
  buildClavicleGeometry,
  buildCraniumGeometry,
  buildFemurGeometry,
  buildFibulaGeometry,
  buildFootPhalangesGeometry,
  buildGreaterTrochanterGeometry,
  buildHandPhalangesGeometry,
  buildHumeralEpicondylesGeometry,
  buildHumerusGeometry,
  buildIliumGeometry,
  buildIschiumGeometry,
  buildMandibleGeometry,
  buildMaxillaGeometry,
  buildMetacarpalsGeometry,
  buildPatellaGeometry,
  buildPubisGeometry,
  buildRadiusGeometry,
  buildRibCageSection,
  buildSacrumGeometry,
  buildScapulaGeometry,
  buildSternumGeometry,
  buildTalusGeometry,
  buildTarsalsMetatarsalsGeometry,
  buildTibiaGeometry,
  buildUlnaGeometry,
  buildVertebralSection
} from './boneGeometryBuilders';
import {
  buildConvergentFascicles,
  buildOrganicMuscle,
  buildRectusAbdominisGeometry,
  buildSerratusAnteriorGeometry
} from './muscleGeometryBuilders';

export type PointUV = readonly [number, number];

export interface ArtworkDefinition {
  artworkRef: string;
  /**
   * Closed smooth spline contours in segment-local normalized coordinates:
   * - u: lateral axis (for bilateral structures, positive = lateral/outer, negative = medial/inner;
   *      for midline structures, 0 = center)
   * - v: proximal (0) -> distal (1) axis along the body segment
   */
  contours: readonly (readonly PointUV[])[];
  /** Optional negative-space inner cavity/foramina cutouts (e.g. orbits, nasal cavity, obturator foramen) */
  cutouts?: readonly (readonly PointUV[])[];
  /** Optional spongy/cancellous trabecular bone zones (epiphyses, vertebral bodies, iliac crest, calcaneus) */
  trabecularZones?: readonly (readonly PointUV[])[];
  /** Optional translucent hyaline/fibrocartilage or tendinous intersection zones */
  cartilageZones?: readonly (readonly PointUV[])[];
  /** Optional internal osteological ridges, sutures, medullary walls, or curved muscle fascicle paths */
  detailPaths?: readonly (readonly PointUV[])[];
  /** Primary focal anchor [u, v] used for hit-testing proximity and leader line */
  anchor: PointUV;
  /** Muscle fiber striation angle or bone trabecular axis in segment-local degrees */
  fiberAngleDeg: number;
  /** Fraction [0..0.45] at proximal end rendered with silvery tendon/aponeurosis sheen */
  tendonProximalRatio: number;
  /** Fraction [0..0.45] at distal end rendered with silvery tendon/aponeurosis sheen */
  tendonDistalRatio: number;
  /** Volumetric shading tuning for 2.5D depth */
  depthShade: {
    highlight: number; // 0..1
    contrast: number; // 0..1
  };
  /** Optional external SVG asset override path for future art upgrades */
  externalSvg?: string;
}

/**
 * Helper to generate a smooth organic anatomical spindle/fusiform contour
 * from centerline/width waypoints: [uCenter, v, halfWidth].
 */
function buildStrip(
  samples: readonly (readonly [number, number, number])[],
  tipTaper = 0.25
): PointUV[] {
  return buildOrganicMuscle(samples, tipTaper, 3).contours[0];
}

function makeEllipse(
  cu: number,
  cv: number,
  ru: number,
  rv: number,
  steps = 12
): PointUV[] {
  const pts: PointUV[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([
      Number((cu + Math.cos(a) * ru).toFixed(3)),
      Number((cv + Math.sin(a) * rv).toFixed(3))
    ]);
  }
  return pts;
}

function makeRibs(
  vStart: number,
  vStep: number,
  count: number,
  uInner: number,
  uOuter: number,
  thickness = 0.024
): PointUV[][] {
  const ribs: PointUV[][] = [];
  for (let i = 0; i < count; i++) {
    const v = vStart + i * vStep;
    const arch = 0.03 + (i / Math.max(1, count - 1)) * 0.025;
    const wScale = i < 4 ? 0.85 + i * 0.05 : 1 - (i - 4) * 0.08;
    const outer = uInner + (uOuter - uInner) * wScale;
    ribs.push([
      [uInner, v - thickness * 0.6],
      [(uInner + outer) * 0.52, v + arch * 0.3 - thickness],
      [outer, v + arch - thickness * 0.5],
      [outer + 0.02, v + arch + thickness * 0.5],
      [(uInner + outer) * 0.52, v + arch * 0.3 + thickness],
      [uInner, v + thickness * 0.6]
    ]);
  }
  return ribs;
}

function makeRays(
  uValues: readonly number[],
  vStart: number,
  vEnd: number,
  halfW: number
): PointUV[][] {
  return uValues.map((u) =>
    buildStrip(
      [
        [u, vStart, halfW * 1.15],
        [u, (vStart + vEnd) * 0.5, halfW * 0.85],
        [u, vEnd, halfW * 1.1]
      ],
      0.8
    )
  );
}

const DEFINITIONS: readonly ArtworkDefinition[] = [
  // =========================================================================
  // 1. HEAD & NECK MUSCLES (10)
  // =========================================================================
  {
    artworkRef: 'm_frontalis',
    contours: [
      [
        [-0.72, 0.12],
        [-0.36, 0.07],
        [0, 0.09],
        [0.36, 0.07],
        [0.72, 0.12],
        [0.76, 0.34],
        [0.36, 0.36],
        [0, 0.32],
        [-0.36, 0.36],
        [-0.76, 0.34]
      ]
    ],
    anchor: [0, 0.22],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.22,
    tendonDistalRatio: 0.08,
    depthShade: { highlight: 0.55, contrast: 0.45 }
  },
  {
    artworkRef: 'm_orbicularis_oculi',
    contours: [makeEllipse(0.38, 0.44, 0.26, 0.105, 16)],
    cutouts: [makeEllipse(0.38, 0.44, 0.13, 0.042, 12)],
    detailPaths: [makeEllipse(0.38, 0.44, 0.195, 0.072, 14)],
    anchor: [0.38, 0.44],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0.05,
    tendonDistalRatio: 0.05,
    depthShade: { highlight: 0.45, contrast: 0.5 }
  },
  {
    artworkRef: 'm_zygomaticus_major',
    contours: [
      buildStrip([
        [0.74, 0.5, 0.085],
        [0.52, 0.62, 0.08],
        [0.28, 0.73, 0.07]
      ])
    ],
    anchor: [0.52, 0.62],
    fiberAngleDeg: -45,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.1,
    depthShade: { highlight: 0.5, contrast: 0.45 }
  },
  {
    artworkRef: 'm_temporalis',
    contours: [
      [
        [0.54, 0.16],
        [0.72, 0.14],
        [0.89, 0.2],
        [0.96, 0.36],
        [0.86, 0.54],
        [0.72, 0.62],
        [0.58, 0.52],
        [0.52, 0.34]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.58, 0.18],
        [0.74, 0.17],
        [0.88, 0.24],
        [0.93, 0.36]
      ],
      [0.70, 0.57]
    ),
    anchor: [0.76, 0.36],
    fiberAngleDeg: 78,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.25,
    depthShade: { highlight: 0.5, contrast: 0.55 }
  },
  {
    artworkRef: 'm_masseter',
    contours: [
      [
        [0.52, 0.52],
        [0.86, 0.5],
        [0.88, 0.82],
        [0.5, 0.86]
      ]
    ],
    anchor: [0.69, 0.68],
    fiberAngleDeg: 82,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.65, contrast: 0.6 }
  },
  {
    artworkRef: 'm_orbicularis_oris',
    contours: [makeEllipse(0, 0.75, 0.34, 0.105, 16)],
    cutouts: [makeEllipse(0, 0.75, 0.18, 0.028, 12)],
    detailPaths: [makeEllipse(0, 0.75, 0.26, 0.065, 14)],
    anchor: [0, 0.75],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0.04,
    tendonDistalRatio: 0.04,
    depthShade: { highlight: 0.5, contrast: 0.45 }
  },
  {
    artworkRef: 'm_sternocleidomastoideus',
    contours: [
      buildStrip([
        [0.58, 0.05, 0.1],
        [0.42, 0.35, 0.12],
        [0.24, 0.7, 0.11],
        [0.12, 0.96, 0.09]
      ])
    ],
    anchor: [0.34, 0.5],
    fiberAngleDeg: -66,
    tendonProximalRatio: 0.18,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.75, contrast: 0.65 }
  },
  {
    artworkRef: 'm_scaleni',
    contours: [
      buildStrip([
        [0.34, 0.24, 0.08],
        [0.52, 0.56, 0.11],
        [0.64, 0.9, 0.1]
      ])
    ],
    anchor: [0.51, 0.56],
    fiberAngleDeg: 68,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.45, contrast: 0.55 }
  },
  {
    artworkRef: 'm_splenius_capitis',
    contours: [
      buildStrip([
        [0.48, 0.06, 0.12],
        [0.32, 0.45, 0.14],
        [0.14, 0.88, 0.1]
      ])
    ],
    anchor: [0.31, 0.45],
    fiberAngleDeg: -62,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.55, contrast: 0.6 }
  },
  {
    artworkRef: 'm_levator_scapulae',
    contours: [
      buildStrip([
        [0.24, 0.18, 0.08],
        [0.42, 0.58, 0.1],
        [0.58, 0.96, 0.11]
      ])
    ],
    anchor: [0.42, 0.58],
    fiberAngleDeg: 64,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.5, contrast: 0.6 }
  },

  // =========================================================================
  // 2. TORSO ANTERIOR & LATERAL (14)
  // =========================================================================
  {
    artworkRef: 'm_pectoralis_major_clavicularis',
    contours: [
      [
        [0.14, 0.06],
        [0.34, 0.055],
        [0.54, 0.07],
        [0.84, 0.18],
        [0.82, 0.25],
        [0.44, 0.19],
        [0.12, 0.15]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.16, 0.08],
        [0.32, 0.075],
        [0.48, 0.09],
        [0.20, 0.13]
      ],
      [0.81, 0.215]
    ),
    anchor: [0.48, 0.14],
    fiberAngleDeg: 14,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.72, contrast: 0.6 }
  },
  {
    artworkRef: 'm_pectoralis_major_sternocostalis',
    contours: [
      [
        [0.08, 0.15],
        [0.44, 0.19],
        [0.84, 0.22],
        [0.82, 0.3],
        [0.46, 0.34],
        [0.1, 0.32]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.11, 0.17],
        [0.11, 0.22],
        [0.11, 0.27],
        [0.14, 0.31]
      ],
      [0.81, 0.25]
    ),
    anchor: [0.44, 0.26],
    fiberAngleDeg: -4,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.78, contrast: 0.65 }
  },
  {
    artworkRef: 'm_pectoralis_major_abdominalis',
    contours: [
      [
        [0.12, 0.32],
        [0.48, 0.34],
        [0.84, 0.26],
        [0.82, 0.32],
        [0.5, 0.42],
        [0.18, 0.39]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.16, 0.34],
        [0.24, 0.37],
        [0.36, 0.39]
      ],
      [0.80, 0.28]
    ),
    anchor: [0.46, 0.35],
    fiberAngleDeg: -22,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.68, contrast: 0.6 }
  },
  {
    artworkRef: 'm_pectoralis_minor',
    contours: [
      [
        [0.64, 0.12],
        [0.74, 0.13],
        [0.62, 0.35],
        [0.38, 0.36],
        [0.42, 0.23]
      ]
    ],
    anchor: [0.56, 0.26],
    fiberAngleDeg: -48,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.45, contrast: 0.65 }
  },
  {
    artworkRef: 'm_subclavius',
    contours: [
      buildStrip([
        [0.24, 0.08, 0.025],
        [0.48, 0.075, 0.03],
        [0.68, 0.08, 0.022]
      ])
    ],
    anchor: [0.48, 0.078],
    fiberAngleDeg: 4,
    tendonProximalRatio: 0.18,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.4, contrast: 0.55 }
  },
  {
    artworkRef: 'm_serratus_anterior',
    ...buildSerratusAnteriorGeometry(),
    anchor: [0.68, 0.46],
    fiberAngleDeg: 28,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.7, contrast: 0.65 }
  },
  {
    artworkRef: 'm_rectus_abdominis',
    ...buildRectusAbdominisGeometry(),
    anchor: [0.18, 0.64],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.78, contrast: 0.7 }
  },
  {
    artworkRef: 'm_obliquus_externus_abdominis',
    contours: [
      [
        [0.48, 0.42],
        [0.62, 0.44],
        [0.76, 0.46],
        [0.75, 0.64],
        [0.72, 0.78],
        [0.58, 0.92],
        [0.34, 0.82],
        [0.36, 0.52]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.68, 0.48],
        [0.72, 0.56],
        [0.71, 0.66],
        [0.68, 0.75]
      ],
      [0.42, 0.82]
    ),
    anchor: [0.54, 0.66],
    fiberAngleDeg: 52,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.72, contrast: 0.62 }
  },
  {
    artworkRef: 'm_obliquus_internus_abdominis',
    contours: [
      [
        [0.36, 0.56],
        [0.68, 0.64],
        [0.66, 0.89],
        [0.34, 0.88]
      ]
    ],
    anchor: [0.51, 0.75],
    fiberAngleDeg: -48,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.5, contrast: 0.6 }
  },
  {
    artworkRef: 'm_transversus_abdominis',
    contours: [
      [
        [0.2, 0.56],
        [0.64, 0.58],
        [0.62, 0.84],
        [0.2, 0.84]
      ]
    ],
    anchor: [0.42, 0.7],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0.18,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.45, contrast: 0.55 }
  },
  {
    artworkRef: 'm_pyramidalis',
    contours: [
      [
        [0.02, 0.82],
        [0.14, 0.93],
        [0.02, 0.95]
      ]
    ],
    anchor: [0.06, 0.9],
    fiberAngleDeg: 78,
    tendonProximalRatio: 0.18,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.45, contrast: 0.5 }
  },
  {
    artworkRef: 'm_intercostales_externi',
    contours: makeRibs(0.18, 0.06, 5, 0.24, 0.62, 0.018),
    anchor: [0.44, 0.3],
    fiberAngleDeg: 45,
    tendonProximalRatio: 0.08,
    tendonDistalRatio: 0.08,
    depthShade: { highlight: 0.4, contrast: 0.55 }
  },
  {
    artworkRef: 'm_diaphragma',
    contours: [
      [
        [-0.58, 0.44],
        [-0.28, 0.36],
        [0, 0.39],
        [0.28, 0.36],
        [0.58, 0.44],
        [0.52, 0.5],
        [0, 0.45],
        [-0.52, 0.5]
      ]
    ],
    anchor: [0, 0.42],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.32,
    tendonDistalRatio: 0.1,
    depthShade: { highlight: 0.5, contrast: 0.6 }
  },
  {
    artworkRef: 'm_linea_alba',
    contours: [
      buildStrip([
        [0, 0.38, 0.032],
        [0, 0.65, 0.036],
        [0, 0.92, 0.024]
      ])
    ],
    anchor: [0, 0.64],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.45,
    tendonDistalRatio: 0.45,
    depthShade: { highlight: 0.8, contrast: 0.4 }
  },

  // =========================================================================
  // 3. TORSO POSTERIOR & SHOULDER GIRDLE (17)
  // =========================================================================
  {
    artworkRef: 'm_trapezius_descendens',
    contours: [
      [
        [0.02, 0.0],
        [0.2, 0.0],
        [0.46, 0.05],
        [0.72, 0.1],
        [0.64, 0.17],
        [0.34, 0.165],
        [0.04, 0.16]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.08, 0.02],
        [0.08, 0.07],
        [0.08, 0.13]
      ],
      [0.68, 0.13]
    ),
    anchor: [0.35, 0.09],
    fiberAngleDeg: 28,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.72, contrast: 0.65 }
  },
  {
    artworkRef: 'm_trapezius_transversa',
    contours: [
      [
        [0.03, 0.16],
        [0.66, 0.17],
        [0.62, 0.29],
        [0.03, 0.3]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.06, 0.18],
        [0.06, 0.23],
        [0.06, 0.28]
      ],
      [0.62, 0.22]
    ),
    anchor: [0.34, 0.23],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.75, contrast: 0.65 }
  },
  {
    artworkRef: 'm_trapezius_ascendens',
    contours: [
      [
        [0.03, 0.3],
        [0.54, 0.24],
        [0.44, 0.36],
        [0.03, 0.54]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.06, 0.35],
        [0.06, 0.43],
        [0.06, 0.50]
      ],
      [0.48, 0.28]
    ),
    anchor: [0.23, 0.37],
    fiberAngleDeg: -38,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.7, contrast: 0.62 }
  },
  {
    artworkRef: 'm_latissimus_dorsi',
    contours: [
      [
        [0.14, 0.4],
        [0.56, 0.36],
        [0.86, 0.28],
        [0.88, 0.44],
        [0.72, 0.74],
        [0.44, 0.88],
        [0.18, 0.78]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.22, 0.46],
        [0.24, 0.60],
        [0.24, 0.74],
        [0.46, 0.84],
        [0.66, 0.72]
      ],
      [0.84, 0.33]
    ),
    anchor: [0.54, 0.56],
    fiberAngleDeg: -42,
    tendonProximalRatio: 0.22,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.76, contrast: 0.68 }
  },
  {
    artworkRef: 'm_rhomboideus_major',
    contours: [
      [
        [0.06, 0.21],
        [0.44, 0.27],
        [0.42, 0.41],
        [0.06, 0.35]
      ]
    ],
    anchor: [0.25, 0.31],
    fiberAngleDeg: 20,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.12,
    depthShade: { highlight: 0.55, contrast: 0.6 }
  },
  {
    artworkRef: 'm_rhomboideus_minor',
    contours: [
      [
        [0.06, 0.13],
        [0.44, 0.19],
        [0.44, 0.25],
        [0.06, 0.19]
      ]
    ],
    anchor: [0.25, 0.19],
    fiberAngleDeg: 20,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.12,
    depthShade: { highlight: 0.52, contrast: 0.6 }
  },
  {
    artworkRef: 'm_teres_major',
    contours: [
      buildStrip([
        [0.52, 0.36, 0.055],
        [0.69, 0.31, 0.06],
        [0.85, 0.25, 0.045]
      ])
    ],
    anchor: [0.69, 0.31],
    fiberAngleDeg: -22,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.7, contrast: 0.62 }
  },
  {
    artworkRef: 'm_teres_minor',
    contours: [
      buildStrip([
        [0.52, 0.29, 0.036],
        [0.68, 0.25, 0.04],
        [0.84, 0.2, 0.032]
      ])
    ],
    anchor: [0.68, 0.25],
    fiberAngleDeg: -22,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.66, contrast: 0.6 }
  },
  {
    artworkRef: 'm_infraspinatus',
    contours: [
      [
        [0.42, 0.21],
        [0.72, 0.19],
        [0.64, 0.33],
        [0.44, 0.35]
      ]
    ],
    anchor: [0.55, 0.27],
    fiberAngleDeg: -10,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.72, contrast: 0.64 }
  },
  {
    artworkRef: 'm_supraspinatus',
    contours: [
      buildStrip([
        [0.4, 0.14, 0.04],
        [0.58, 0.14, 0.045],
        [0.78, 0.15, 0.035]
      ])
    ],
    anchor: [0.58, 0.14],
    fiberAngleDeg: 4,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.26,
    depthShade: { highlight: 0.55, contrast: 0.6 }
  },
  {
    artworkRef: 'm_subscapularis',
    contours: [
      [
        [0.44, 0.18],
        [0.74, 0.18],
        [0.72, 0.34],
        [0.46, 0.34]
      ]
    ],
    anchor: [0.59, 0.26],
    fiberAngleDeg: -6,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.45, contrast: 0.6 }
  },
  {
    artworkRef: 'm_erector_iliocostalis',
    contours: [
      buildStrip([
        [0.24, 0.22, 0.06],
        [0.28, 0.52, 0.075],
        [0.28, 0.85, 0.07]
      ])
    ],
    anchor: [0.27, 0.55],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.62, contrast: 0.6 }
  },
  {
    artworkRef: 'm_erector_longissimus',
    contours: [
      buildStrip([
        [0.14, 0.14, 0.055],
        [0.16, 0.5, 0.07],
        [0.16, 0.88, 0.065]
      ])
    ],
    anchor: [0.16, 0.52],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.66, contrast: 0.62 }
  },
  {
    artworkRef: 'm_erector_spinalis',
    contours: [
      buildStrip([
        [0.06, 0.2, 0.038],
        [0.07, 0.48, 0.045],
        [0.07, 0.76, 0.04]
      ])
    ],
    anchor: [0.07, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.58, contrast: 0.58 }
  },
  {
    artworkRef: 'm_quadratus_lumborum',
    contours: [
      [
        [0.14, 0.62],
        [0.34, 0.64],
        [0.42, 0.87],
        [0.16, 0.87]
      ]
    ],
    anchor: [0.27, 0.75],
    fiberAngleDeg: 78,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.5, contrast: 0.62 }
  },
  {
    artworkRef: 'm_multifidi',
    contours: [
      buildStrip([
        [0.05, 0.5, 0.035],
        [0.07, 0.72, 0.05],
        [0.08, 0.92, 0.055]
      ])
    ],
    anchor: [0.07, 0.72],
    fiberAngleDeg: 74,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.48, contrast: 0.6 }
  },
  {
    artworkRef: 'm_fascia_thoracolumbalis',
    contours: [
      [
        [0, 0.46],
        [0.12, 0.56],
        [0.27, 0.69],
        [0.22, 0.82],
        [0.12, 0.9],
        [0, 0.97],
        [-0.12, 0.9],
        [-0.22, 0.82],
        [-0.27, 0.69],
        [-0.12, 0.56]
      ]
    ],
    detailPaths: [
      [
        [0, 0.48],
        [0, 0.95]
      ],
      [
        [-0.1, 0.58],
        [0.2, 0.8]
      ],
      [
        [0.1, 0.58],
        [-0.2, 0.8]
      ],
      [
        [-0.22, 0.69],
        [0.1, 0.88]
      ],
      [
        [0.22, 0.69],
        [-0.1, 0.88]
      ]
    ],
    anchor: [0, 0.74],
    fiberAngleDeg: 45,
    tendonProximalRatio: 0.3,
    tendonDistalRatio: 0.3,
    depthShade: { highlight: 0.76, contrast: 0.44 }
  },

  // =========================================================================
  // 4. UPPER ARM & SHOULDER (11)
  // =========================================================================
  {
    artworkRef: 'm_deltoideus_clavicularis',
    contours: [
      buildStrip([
        [-0.24, 0.02, 0.16],
        [-0.14, 0.18, 0.18],
        [0.02, 0.36, 0.11]
      ])
    ],
    anchor: [-0.12, 0.18],
    fiberAngleDeg: 74,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.78, contrast: 0.62 }
  },
  {
    artworkRef: 'm_deltoideus_acromialis',
    contours: [
      buildStrip([
        [0.14, 0.0, 0.2],
        [0.18, 0.19, 0.22],
        [0.08, 0.38, 0.12]
      ])
    ],
    anchor: [0.16, 0.19],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.82, contrast: 0.65 }
  },
  {
    artworkRef: 'm_deltoideus_spinalis',
    contours: [
      buildStrip([
        [-0.14, 0.03, 0.15],
        [-0.08, 0.19, 0.17],
        [0.04, 0.37, 0.1]
      ])
    ],
    anchor: [-0.07, 0.19],
    fiberAngleDeg: -72,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.74, contrast: 0.62 }
  },
  {
    artworkRef: 'm_biceps_caput_longum',
    contours: [
      buildStrip([
        [0.12, 0.24, 0.12],
        [0.14, 0.56, 0.16],
        [0.06, 0.9, 0.1]
      ])
    ],
    anchor: [0.12, 0.56],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.22,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.84, contrast: 0.66 }
  },
  {
    artworkRef: 'm_biceps_caput_breve',
    contours: [
      buildStrip([
        [-0.14, 0.24, 0.12],
        [-0.12, 0.56, 0.15],
        [-0.02, 0.9, 0.1]
      ])
    ],
    anchor: [-0.1, 0.56],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.2,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.8, contrast: 0.64 }
  },
  {
    artworkRef: 'm_brachialis',
    contours: [
      buildStrip([
        [0.0, 0.48, 0.2],
        [0.02, 0.72, 0.24],
        [0.0, 0.95, 0.16]
      ])
    ],
    anchor: [0.01, 0.72],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.55, contrast: 0.65 }
  },
  {
    artworkRef: 'm_coracobrachialis',
    contours: [
      buildStrip([
        [-0.26, 0.14, 0.08],
        [-0.22, 0.34, 0.1],
        [-0.14, 0.54, 0.07]
      ])
    ],
    anchor: [-0.21, 0.34],
    fiberAngleDeg: 78,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.48, contrast: 0.58 }
  },
  {
    artworkRef: 'm_triceps_caput_longum',
    contours: [
      buildStrip([
        [-0.16, 0.18, 0.14],
        [-0.12, 0.52, 0.17],
        [-0.04, 0.86, 0.12]
      ])
    ],
    anchor: [-0.11, 0.52],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.26,
    depthShade: { highlight: 0.8, contrast: 0.65 }
  },
  {
    artworkRef: 'm_triceps_caput_laterale',
    contours: [
      buildStrip([
        [0.16, 0.28, 0.13],
        [0.18, 0.54, 0.16],
        [0.08, 0.82, 0.12]
      ])
    ],
    anchor: [0.16, 0.54],
    fiberAngleDeg: 82,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.26,
    depthShade: { highlight: 0.82, contrast: 0.66 }
  },
  {
    artworkRef: 'm_triceps_caput_mediale',
    contours: [
      buildStrip([
        [0.0, 0.46, 0.16],
        [0.0, 0.72, 0.2],
        [0.0, 0.94, 0.15]
      ])
    ],
    anchor: [0.0, 0.72],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.55, contrast: 0.64 }
  },
  {
    artworkRef: 'm_anconeus',
    contours: [
      [
        [0.12, 0.84],
        [0.32, 0.86],
        [0.24, 0.99],
        [0.06, 0.97]
      ]
    ],
    anchor: [0.19, 0.91],
    fiberAngleDeg: 58,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.12,
    depthShade: { highlight: 0.6, contrast: 0.55 }
  },

  // =========================================================================
  // 5. FOREARM & HAND (17)
  // =========================================================================
  {
    artworkRef: 'm_brachioradialis',
    contours: [
      buildStrip([
        [0.22, 0.0, 0.13],
        [0.28, 0.32, 0.17],
        [0.26, 0.68, 0.11],
        [0.22, 0.96, 0.06]
      ])
    ],
    anchor: [0.26, 0.35],
    fiberAngleDeg: 86,
    tendonProximalRatio: 0.08,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.8, contrast: 0.64 }
  },
  {
    artworkRef: 'm_pronator_teres',
    contours: [
      buildStrip([
        [-0.24, 0.03, 0.1],
        [-0.06, 0.22, 0.12],
        [0.14, 0.44, 0.09]
      ])
    ],
    anchor: [-0.06, 0.22],
    fiberAngleDeg: 45,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.68, contrast: 0.6 }
  },
  {
    artworkRef: 'm_flexor_carpi_radialis',
    contours: [
      buildStrip([
        [-0.18, 0.06, 0.1],
        [-0.04, 0.38, 0.12],
        [0.1, 0.94, 0.05]
      ])
    ],
    anchor: [-0.03, 0.42],
    fiberAngleDeg: 80,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.38,
    depthShade: { highlight: 0.72, contrast: 0.6 }
  },
  {
    artworkRef: 'm_palmaris_longus',
    contours: [
      buildStrip([
        [-0.14, 0.08, 0.07],
        [-0.04, 0.34, 0.08],
        [0.0, 0.96, 0.035]
      ])
    ],
    anchor: [-0.04, 0.38],
    fiberAngleDeg: 85,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.44,
    depthShade: { highlight: 0.75, contrast: 0.56 }
  },
  {
    artworkRef: 'm_flexor_carpi_ulnaris',
    contours: [
      buildStrip([
        [-0.24, 0.08, 0.1],
        [-0.26, 0.42, 0.13],
        [-0.2, 0.94, 0.06]
      ])
    ],
    anchor: [-0.25, 0.44],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.3,
    depthShade: { highlight: 0.72, contrast: 0.62 }
  },
  {
    artworkRef: 'm_flexor_digitorum_superficialis',
    contours: [
      buildStrip([
        [-0.14, 0.16, 0.16],
        [-0.08, 0.52, 0.2],
        [-0.04, 0.94, 0.12]
      ])
    ],
    anchor: [-0.08, 0.54],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.55, contrast: 0.64 }
  },
  {
    artworkRef: 'm_extensor_carpi_radialis_longus',
    contours: [
      buildStrip([
        [0.24, 0.04, 0.1],
        [0.24, 0.36, 0.12],
        [0.18, 0.94, 0.05]
      ])
    ],
    anchor: [0.23, 0.38],
    fiberAngleDeg: 86,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.38,
    depthShade: { highlight: 0.74, contrast: 0.6 }
  },
  {
    artworkRef: 'm_extensor_carpi_radialis_brevis',
    contours: [
      buildStrip([
        [0.16, 0.08, 0.09],
        [0.14, 0.4, 0.11],
        [0.1, 0.94, 0.05]
      ])
    ],
    anchor: [0.14, 0.42],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.36,
    depthShade: { highlight: 0.62, contrast: 0.6 }
  },
  {
    artworkRef: 'm_extensor_digitorum',
    contours: [
      buildStrip([
        [0.06, 0.1, 0.11],
        [0.02, 0.44, 0.15],
        [-0.02, 0.94, 0.09]
      ])
    ],
    anchor: [0.02, 0.45],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.35,
    depthShade: { highlight: 0.76, contrast: 0.62 }
  },
  {
    artworkRef: 'm_extensor_digiti_minimi',
    contours: [
      buildStrip([
        [-0.08, 0.14, 0.06],
        [-0.1, 0.48, 0.07],
        [-0.12, 0.94, 0.04]
      ])
    ],
    anchor: [-0.1, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.38,
    depthShade: { highlight: 0.68, contrast: 0.56 }
  },
  {
    artworkRef: 'm_extensor_carpi_ulnaris',
    contours: [
      buildStrip([
        [-0.2, 0.1, 0.09],
        [-0.22, 0.44, 0.12],
        [-0.2, 0.94, 0.05]
      ])
    ],
    anchor: [-0.21, 0.45],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.32,
    depthShade: { highlight: 0.72, contrast: 0.6 }
  },
  {
    artworkRef: 'm_supinator',
    contours: [
      buildStrip([
        [0.1, 0.08, 0.12],
        [0.14, 0.22, 0.14],
        [0.18, 0.36, 0.1]
      ])
    ],
    anchor: [0.14, 0.22],
    fiberAngleDeg: 40,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.12,
    depthShade: { highlight: 0.48, contrast: 0.6 }
  },
  {
    artworkRef: 'm_abductor_pollicis_longus',
    contours: [
      buildStrip([
        [-0.04, 0.42, 0.08],
        [0.12, 0.68, 0.1],
        [0.24, 0.94, 0.06]
      ])
    ],
    anchor: [0.12, 0.68],
    fiberAngleDeg: 62,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.3,
    depthShade: { highlight: 0.68, contrast: 0.58 }
  },
  {
    artworkRef: 'm_extensor_pollicis_longus',
    contours: [
      buildStrip([
        [-0.08, 0.46, 0.07],
        [0.06, 0.72, 0.08],
        [0.2, 0.96, 0.05]
      ])
    ],
    anchor: [0.06, 0.72],
    fiberAngleDeg: 64,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.65, contrast: 0.58 }
  },
  {
    artworkRef: 'm_thenar',
    contours: [makeEllipse(0.28, 0.32, 0.19, 0.22, 12)],
    anchor: [0.28, 0.32],
    fiberAngleDeg: 58,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.75, contrast: 0.58 }
  },
  {
    artworkRef: 'm_hypothenar',
    contours: [makeEllipse(-0.26, 0.3, 0.14, 0.24, 12)],
    anchor: [-0.26, 0.3],
    fiberAngleDeg: 85,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.15,
    depthShade: { highlight: 0.7, contrast: 0.58 }
  },
  {
    artworkRef: 'm_interossei_dorsales_manus',
    contours: makeRays([-0.2, -0.05, 0.1, 0.25], 0.18, 0.52, 0.045),
    anchor: [0.02, 0.35],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.62, contrast: 0.58 }
  },

  // =========================================================================
  // 6. PELVIS & HIP (8)
  // =========================================================================
  {
    artworkRef: 'm_gluteus_maximus',
    contours: [
      [
        [0.08, 0.22],
        [0.54, 0.28],
        [0.74, 0.64],
        [0.64, 0.96],
        [0.18, 0.9],
        [0.04, 0.56]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.12, 0.28],
        [0.10, 0.44],
        [0.10, 0.60],
        [0.16, 0.78]
      ],
      [0.68, 0.72]
    ),
    anchor: [0.38, 0.58],
    fiberAngleDeg: 42,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.84, contrast: 0.68 }
  },
  {
    artworkRef: 'm_gluteus_medius',
    contours: [
      [
        [0.24, 0.06],
        [0.74, 0.1],
        [0.86, 0.44],
        [0.74, 0.62],
        [0.44, 0.38]
      ]
    ],
    detailPaths: buildConvergentFascicles(
      [
        [0.30, 0.12],
        [0.48, 0.12],
        [0.68, 0.14]
      ],
      [0.76, 0.54]
    ),
    anchor: [0.62, 0.3],
    fiberAngleDeg: 64,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.72, contrast: 0.62 }
  },
  {
    artworkRef: 'm_gluteus_minimus',
    contours: [
      [
        [0.34, 0.14],
        [0.68, 0.18],
        [0.78, 0.52],
        [0.48, 0.42]
      ]
    ],
    anchor: [0.58, 0.32],
    fiberAngleDeg: 68,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.5, contrast: 0.6 }
  },
  {
    artworkRef: 'm_tensor_fasciae_latae',
    contours: [
      buildStrip([
        [0.74, 0.14, 0.11],
        [0.84, 0.48, 0.14],
        [0.88, 0.92, 0.09]
      ])
    ],
    anchor: [0.83, 0.48],
    fiberAngleDeg: 82,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.3,
    depthShade: { highlight: 0.74, contrast: 0.6 }
  },
  {
    artworkRef: 'm_iliopsoas',
    contours: [
      buildStrip([
        [0.14, 0.02, 0.12],
        [0.34, 0.38, 0.18],
        [0.42, 0.86, 0.12]
      ])
    ],
    anchor: [0.33, 0.42],
    fiberAngleDeg: 72,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.54, contrast: 0.64 }
  },
  {
    artworkRef: 'm_piriformis',
    contours: [
      buildStrip([
        [0.14, 0.42, 0.09],
        [0.44, 0.49, 0.1],
        [0.74, 0.56, 0.05]
      ])
    ],
    anchor: [0.44, 0.49],
    fiberAngleDeg: 18,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.56, contrast: 0.62 }
  },
  {
    artworkRef: 'm_obturatorius_gemelli',
    contours: [
      buildStrip([
        [0.24, 0.56, 0.08],
        [0.48, 0.58, 0.09],
        [0.74, 0.59, 0.05]
      ])
    ],
    anchor: [0.48, 0.58],
    fiberAngleDeg: 6,
    tendonProximalRatio: 0.15,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.48, contrast: 0.6 }
  },
  {
    artworkRef: 'm_quadratus_femoris',
    contours: [
      [
        [0.28, 0.68],
        [0.68, 0.66],
        [0.68, 0.78],
        [0.28, 0.8]
      ]
    ],
    anchor: [0.48, 0.73],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.48, contrast: 0.6 }
  },

  // =========================================================================
  // 7. THIGH (15)
  // =========================================================================
  {
    artworkRef: 'm_sartorius',
    contours: [
      buildStrip([
        [0.24, 0.02, 0.065],
        [0.06, 0.36, 0.065],
        [-0.16, 0.72, 0.06],
        [-0.22, 0.99, 0.045]
      ])
    ],
    anchor: [0.02, 0.44],
    fiberAngleDeg: -68,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.74, contrast: 0.58 }
  },
  {
    artworkRef: 'm_rectus_femoris',
    contours: [
      buildStrip([
        [0.06, 0.04, 0.1],
        [0.04, 0.4, 0.15],
        [0.02, 0.78, 0.09],
        [0.0, 0.94, 0.05]
      ])
    ],
    anchor: [0.04, 0.42],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.86, contrast: 0.68 }
  },
  {
    artworkRef: 'm_vastus_lateralis',
    contours: [
      buildStrip([
        [0.22, 0.1, 0.12],
        [0.24, 0.46, 0.16],
        [0.18, 0.84, 0.1]
      ])
    ],
    anchor: [0.22, 0.46],
    fiberAngleDeg: 82,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.84, contrast: 0.68 }
  },
  {
    artworkRef: 'm_vastus_medialis',
    contours: [
      buildStrip([
        [-0.08, 0.42, 0.1],
        [-0.16, 0.68, 0.15],
        [-0.12, 0.9, 0.11]
      ])
    ],
    anchor: [-0.14, 0.7],
    fiberAngleDeg: -60,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.86, contrast: 0.66 }
  },
  {
    artworkRef: 'm_vastus_intermedius',
    contours: [
      buildStrip([
        [0.02, 0.18, 0.13],
        [0.02, 0.52, 0.16],
        [0.01, 0.84, 0.11]
      ])
    ],
    anchor: [0.02, 0.52],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.52, contrast: 0.62 }
  },
  {
    artworkRef: 'm_tractus_iliotibialis',
    contours: [
      buildStrip([
        [0.34, 0.04, 0.06],
        [0.35, 0.5, 0.055],
        [0.28, 0.98, 0.045]
      ])
    ],
    anchor: [0.34, 0.5],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.45,
    tendonDistalRatio: 0.45,
    depthShade: { highlight: 0.82, contrast: 0.44 }
  },
  {
    artworkRef: 'm_pectineus',
    contours: [
      [
        [-0.28, 0.04],
        [-0.1, 0.06],
        [-0.06, 0.22],
        [-0.22, 0.2]
      ]
    ],
    anchor: [-0.17, 0.13],
    fiberAngleDeg: -52,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.12,
    depthShade: { highlight: 0.64, contrast: 0.58 }
  },
  {
    artworkRef: 'm_adductor_longus',
    contours: [
      buildStrip([
        [-0.28, 0.08, 0.09],
        [-0.18, 0.34, 0.13],
        [-0.06, 0.62, 0.08]
      ])
    ],
    anchor: [-0.18, 0.34],
    fiberAngleDeg: -68,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.76, contrast: 0.62 }
  },
  {
    artworkRef: 'm_adductor_brevis',
    contours: [
      [
        [-0.28, 0.08],
        [-0.12, 0.12],
        [-0.08, 0.36],
        [-0.24, 0.32]
      ]
    ],
    anchor: [-0.18, 0.22],
    fiberAngleDeg: -60,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.14,
    depthShade: { highlight: 0.5, contrast: 0.6 }
  },
  {
    artworkRef: 'm_adductor_magnus',
    contours: [
      [
        [-0.28, 0.16],
        [-0.04, 0.28],
        [-0.04, 0.84],
        [-0.22, 0.72],
        [-0.32, 0.38]
      ]
    ],
    anchor: [-0.18, 0.48],
    fiberAngleDeg: -72,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.18,
    depthShade: { highlight: 0.64, contrast: 0.64 }
  },
  {
    artworkRef: 'm_gracilis',
    contours: [
      buildStrip([
        [-0.32, 0.08, 0.065],
        [-0.3, 0.5, 0.065],
        [-0.22, 0.96, 0.04]
      ])
    ],
    anchor: [-0.29, 0.5],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.26,
    depthShade: { highlight: 0.74, contrast: 0.6 }
  },
  {
    artworkRef: 'm_biceps_femoris_longum',
    contours: [
      buildStrip([
        [0.06, 0.08, 0.11],
        [0.16, 0.48, 0.14],
        [0.24, 0.94, 0.08]
      ])
    ],
    anchor: [0.16, 0.48],
    fiberAngleDeg: 84,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.24,
    depthShade: { highlight: 0.82, contrast: 0.66 }
  },
  {
    artworkRef: 'm_biceps_femoris_breve',
    contours: [
      buildStrip([
        [0.14, 0.44, 0.1],
        [0.2, 0.68, 0.11],
        [0.24, 0.92, 0.07]
      ])
    ],
    anchor: [0.2, 0.68],
    fiberAngleDeg: 82,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.2,
    depthShade: { highlight: 0.54, contrast: 0.62 }
  },
  {
    artworkRef: 'm_semitendinosus',
    contours: [
      buildStrip([
        [-0.08, 0.08, 0.11],
        [-0.14, 0.42, 0.14],
        [-0.2, 0.94, 0.05]
      ])
    ],
    anchor: [-0.14, 0.44],
    fiberAngleDeg: -86,
    tendonProximalRatio: 0.14,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.82, contrast: 0.66 }
  },
  {
    artworkRef: 'm_semimembranosus',
    contours: [
      buildStrip([
        [-0.12, 0.12, 0.11],
        [-0.18, 0.56, 0.16],
        [-0.16, 0.92, 0.11]
      ])
    ],
    anchor: [-0.17, 0.58],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.22,
    tendonDistalRatio: 0.16,
    depthShade: { highlight: 0.66, contrast: 0.65 }
  },

  // =========================================================================
  // 8. LOWER LEG & FOOT (12)
  // =========================================================================
  {
    artworkRef: 'm_popliteus',
    contours: [
      [
        [0.16, 0.02],
        [0.24, 0.06],
        [-0.12, 0.22],
        [-0.18, 0.14]
      ]
    ],
    anchor: [0.02, 0.11],
    fiberAngleDeg: -38,
    tendonProximalRatio: 0.16,
    tendonDistalRatio: 0.1,
    depthShade: { highlight: 0.48, contrast: 0.58 }
  },
  {
    artworkRef: 'm_tibialis_anterior',
    contours: [
      buildStrip([
        [0.08, 0.08, 0.1],
        [0.1, 0.36, 0.13],
        [0.02, 0.72, 0.08],
        [-0.08, 0.96, 0.05]
      ])
    ],
    anchor: [0.08, 0.38],
    fiberAngleDeg: 86,
    tendonProximalRatio: 0.08,
    tendonDistalRatio: 0.32,
    depthShade: { highlight: 0.82, contrast: 0.64 }
  },
  {
    artworkRef: 'm_extensor_digitorum_longus',
    contours: [
      buildStrip([
        [0.18, 0.1, 0.08],
        [0.2, 0.44, 0.1],
        [0.14, 0.88, 0.06]
      ])
    ],
    anchor: [0.19, 0.46],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.08,
    tendonDistalRatio: 0.32,
    depthShade: { highlight: 0.74, contrast: 0.6 }
  },
  {
    artworkRef: 'm_extensor_hallucis_longus',
    contours: [
      buildStrip([
        [0.08, 0.38, 0.06],
        [0.06, 0.66, 0.07],
        [-0.02, 0.96, 0.04]
      ])
    ],
    anchor: [0.05, 0.66],
    fiberAngleDeg: 84,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.6, contrast: 0.58 }
  },
  {
    artworkRef: 'm_fibularis_longus',
    contours: [
      buildStrip([
        [0.26, 0.1, 0.09],
        [0.3, 0.36, 0.11],
        [0.26, 0.74, 0.06],
        [0.22, 0.96, 0.04]
      ])
    ],
    anchor: [0.28, 0.38],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.36,
    depthShade: { highlight: 0.78, contrast: 0.62 }
  },
  {
    artworkRef: 'm_fibularis_brevis',
    contours: [
      buildStrip([
        [0.24, 0.42, 0.07],
        [0.26, 0.68, 0.09],
        [0.24, 0.94, 0.05]
      ])
    ],
    anchor: [0.25, 0.68],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.3,
    depthShade: { highlight: 0.64, contrast: 0.58 }
  },
  {
    artworkRef: 'm_gastrocnemius_mediale',
    contours: [
      buildStrip([
        [-0.14, 0.04, 0.12],
        [-0.16, 0.28, 0.16],
        [-0.12, 0.54, 0.11]
      ])
    ],
    anchor: [-0.15, 0.28],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.86, contrast: 0.68 }
  },
  {
    artworkRef: 'm_gastrocnemius_laterale',
    contours: [
      buildStrip([
        [0.14, 0.04, 0.11],
        [0.16, 0.26, 0.14],
        [0.12, 0.5, 0.1]
      ])
    ],
    anchor: [0.15, 0.26],
    fiberAngleDeg: 88,
    tendonProximalRatio: 0.12,
    tendonDistalRatio: 0.22,
    depthShade: { highlight: 0.84, contrast: 0.68 }
  },
  {
    artworkRef: 'm_soleus',
    contours: [
      buildStrip([
        [0.0, 0.16, 0.2],
        [0.0, 0.48, 0.24],
        [0.0, 0.76, 0.14]
      ])
    ],
    anchor: [0.0, 0.5],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.25,
    depthShade: { highlight: 0.64, contrast: 0.62 }
  },
  {
    artworkRef: 'm_tibialis_posterior',
    contours: [
      buildStrip([
        [-0.04, 0.2, 0.11],
        [-0.06, 0.52, 0.13],
        [-0.14, 0.94, 0.06]
      ])
    ],
    anchor: [-0.07, 0.54],
    fiberAngleDeg: 86,
    tendonProximalRatio: 0.1,
    tendonDistalRatio: 0.34,
    depthShade: { highlight: 0.5, contrast: 0.62 }
  },
  {
    artworkRef: 'm_tendo_calcaneus',
    contours: [
      buildStrip([
        [0.0, 0.52, 0.14],
        [0.0, 0.74, 0.075],
        [0.0, 0.98, 0.085]
      ])
    ],
    anchor: [0.0, 0.78],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.45,
    tendonDistalRatio: 0.45,
    depthShade: { highlight: 0.88, contrast: 0.48 }
  },
  {
    artworkRef: 'm_aponeurosis_plantaris',
    contours: [
      [
        [-0.18, 0.2],
        [0.18, 0.2],
        [0.3, 0.72],
        [0.0, 0.82],
        [-0.3, 0.72]
      ]
    ],
    anchor: [0.0, 0.52],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0.35,
    tendonDistalRatio: 0.35,
    depthShade: { highlight: 0.75, contrast: 0.45 }
  },

  // =========================================================================
  // B. BONES & PHYSIO LANDMARKS (32) — AAA Osteology Atlas Geometry
  // =========================================================================
  {
    artworkRef: 'b_cranium',
    ...buildCraniumGeometry(),
    anchor: [0, 0.27],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_maxilla',
    ...buildMaxillaGeometry(),
    anchor: [0, 0.58],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.82, contrast: 0.64 }
  },
  {
    artworkRef: 'b_mandibula',
    ...buildMandibleGeometry(),
    anchor: [0, 0.86],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.85, contrast: 0.66 }
  },
  {
    artworkRef: 'b_atlas_axis',
    ...buildAtlasAxisGeometry(),
    anchor: [0, 0.19],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.85, contrast: 0.68 }
  },
  {
    artworkRef: 'b_vertebrae_cervicales',
    ...buildVertebralSection({
      count: 5,
      vStart: 0.32,
      vEnd: 0.94,
      bodyHWStart: 0.145,
      bodyHWEnd: 0.185,
      transSpanStart: 0.26,
      transSpanEnd: 0.34,
      spinousDrop: 0.025,
      includeBottomDisc: true
    }),
    anchor: [0, 0.62],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.68 }
  },
  {
    artworkRef: 'b_clavicula',
    ...buildClavicleGeometry(),
    anchor: [0.46, 0.058],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.68 }
  },
  {
    artworkRef: 'b_sternum',
    ...buildSternumGeometry(),
    anchor: [0, 0.24],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.7 }
  },
  {
    artworkRef: 'b_costae_verae',
    ...buildRibCageSection({ isTrueRibs: true }),
    anchor: [0.42, 0.26],
    fiberAngleDeg: 10,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.64 }
  },
  {
    artworkRef: 'b_costae_spuriae',
    ...buildRibCageSection({ isTrueRibs: false }),
    anchor: [0.44, 0.54],
    fiberAngleDeg: 14,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.82, contrast: 0.62 }
  },
  {
    artworkRef: 'b_scapula',
    ...buildScapulaGeometry(),
    anchor: [0.58, 0.24],
    fiberAngleDeg: -16,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_vertebrae_thoracicae',
    ...buildVertebralSection({
      count: 12,
      vStart: 0.02,
      vEnd: 0.56,
      bodyHWStart: 0.056,
      bodyHWEnd: 0.088,
      transSpanStart: 0.108,
      transSpanEnd: 0.145,
      spinousDrop: 0.016,
      includeBottomDisc: true
    }),
    anchor: [0, 0.29],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.7 }
  },
  {
    artworkRef: 'b_vertebrae_lumbales',
    ...buildVertebralSection({
      count: 5,
      vStart: 0.57,
      vEnd: 0.94,
      bodyHWStart: 0.095,
      bodyHWEnd: 0.125,
      transSpanStart: 0.165,
      transSpanEnd: 0.205,
      spinousDrop: 0.018,
      includeBottomDisc: true
    }),
    anchor: [0, 0.76],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.7 }
  },
  {
    artworkRef: 'b_humerus',
    ...buildHumerusGeometry(),
    anchor: [0.0, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.7 }
  },
  {
    artworkRef: 'b_epicondylus_humeri',
    ...buildHumeralEpicondylesGeometry(),
    anchor: [0, 0.92],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.7 }
  },
  {
    artworkRef: 'b_radius',
    ...buildRadiusGeometry(),
    anchor: [0.15, 0.5],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_ulna',
    ...buildUlnaGeometry(),
    anchor: [-0.15, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_ossa_carpi',
    ...buildCarpalsGeometry(),
    anchor: [0.04, 0.1],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.65 }
  },
  {
    artworkRef: 'b_ossa_metacarpi',
    ...buildMetacarpalsGeometry(),
    anchor: [0.04, 0.37],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.65 }
  },
  {
    artworkRef: 'b_phalanges_manus',
    ...buildHandPhalangesGeometry(),
    anchor: [0.04, 0.76],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.84, contrast: 0.64 }
  },
  {
    artworkRef: 'b_os_ilium',
    ...buildIliumGeometry(),
    anchor: [0.56, 0.3],
    fiberAngleDeg: 18,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_os_ischii',
    ...buildIschiumGeometry(),
    anchor: [0.42, 0.76],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.68 }
  },
  {
    artworkRef: 'b_os_pubis',
    ...buildPubisGeometry(),
    anchor: [0, 0.7],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.68 }
  },
  {
    artworkRef: 'b_os_sacrum',
    ...buildSacrumGeometry(),
    anchor: [0, 0.46],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.7 }
  },
  {
    artworkRef: 'b_femur',
    ...buildFemurGeometry(),
    anchor: [0.03, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.92, contrast: 0.72 }
  },
  {
    artworkRef: 'b_trochanter_major',
    ...buildGreaterTrochanterGeometry(),
    anchor: [0.84, 0.58],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.68 }
  },
  {
    artworkRef: 'b_patella',
    ...buildPatellaGeometry(),
    anchor: [0, 0.955],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.92, contrast: 0.68 }
  },
  {
    artworkRef: 'b_tibia',
    ...buildTibiaGeometry(),
    anchor: [-0.06, 0.48],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.7 }
  },
  {
    artworkRef: 'b_fibula',
    ...buildFibulaGeometry(),
    anchor: [0.21, 0.5],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.68 }
  },
  {
    artworkRef: 'b_talus',
    ...buildTalusGeometry(),
    anchor: [0, 0.145],
    fiberAngleDeg: 0,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.88, contrast: 0.66 }
  },
  {
    artworkRef: 'b_calcaneus',
    ...buildCalcaneusGeometry(),
    anchor: [0, 0.23],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.9, contrast: 0.68 }
  },
  {
    artworkRef: 'b_ossa_tarsi_metatarsi',
    ...buildTarsalsMetatarsalsGeometry(),
    anchor: [0.02, 0.46],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.86, contrast: 0.65 }
  },
  {
    artworkRef: 'b_phalanges_pedis',
    ...buildFootPhalangesGeometry(),
    anchor: [0.02, 0.82],
    fiberAngleDeg: 90,
    tendonProximalRatio: 0,
    tendonDistalRatio: 0,
    depthShade: { highlight: 0.84, contrast: 0.64 }
  }
];

function deriveMuscleDetailPaths(def: ArtworkDefinition): readonly (readonly PointUV[])[] | undefined {
  if (def.detailPaths && def.detailPaths.length > 0) return def.detailPaths;
  if (def.artworkRef.startsWith('b_')) return def.detailPaths;

  const poly = def.contours[0];
  if (!poly || poly.length < 6) return undefined;
  // For symmetric strip contours (left edge down, right edge up), extract curved centerline & offset fibers
  const half = Math.floor(poly.length / 2);
  if (poly.length >= 12) {
    const center: PointUV[] = [];
    const innerL: PointUV[] = [];
    const innerR: PointUV[] = [];
    for (let i = 1; i < half - 1; i++) {
      const l = poly[i];
      const r = poly[poly.length - 1 - i];
      const cu = (l[0] + r[0]) * 0.5;
      const cv = (l[1] + r[1]) * 0.5;
      center.push([cu, cv]);
      innerL.push([cu + (l[0] - cu) * 0.48, cv + (l[1] - cv) * 0.48]);
      innerR.push([cu + (r[0] - cu) * 0.48, cv + (r[1] - cv) * 0.48]);
    }
    if (center.length >= 2) {
      return [center, innerL, innerR];
    }
  }
  return undefined;
}

export const ANATOMY_ARTWORK_REGISTRY: ReadonlyMap<string, ArtworkDefinition> = new Map(
  DEFINITIONS.map((def) => [
    def.artworkRef,
    {
      ...def,
      detailPaths: deriveMuscleDetailPaths(def)
    }
  ])
);
