import type { PointUV } from './anatomyRegistry';

export interface MuscleGeometrySpec {
  contours: PointUV[][];
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
 * Interpolates a sequence of waypoints using Catmull-Rom splines to produce smooth
 * organic anatomical contours and curved fascicle streamlines.
 */
function sampleCatmullRom(
  pts: readonly (readonly [number, number, number])[],
  subdivisions = 3
): [number, number, number][] {
  if (pts.length < 2) return pts.map(([u, v, w]) => [u, v, w]);
  const out: [number, number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];

    const steps = i === n - 2 ? subdivisions + 1 : subdivisions;
    for (let s = 0; s < steps; s++) {
      const t = s / subdivisions;
      const t2 = t * t;
      const t3 = t2 * t;
      const interp = (idx: 0 | 1 | 2) =>
        0.5 *
        (2 * p1[idx] +
          (-p0[idx] + p2[idx]) * t +
          (2 * p0[idx] - 5 * p1[idx] + 4 * p2[idx] - p3[idx]) * t2 +
          (-p0[idx] + 3 * p1[idx] - 3 * p2[idx] + p3[idx]) * t3);
      out.push([interp(0), interp(1), Math.max(0.008, interp(2))]);
    }
  }
  return out;
}

/**
 * Generates an organic fusiform/pennate muscle contour with Catmull-Rom smoothing
 * and curved internal fascicle trajectories along the muscle belly.
 */
export function buildOrganicMuscle(
  samples: readonly (readonly [number, number, number])[],
  tipTaper = 0.25,
  subdivisions = 3
): MuscleGeometrySpec {
  const scaled: [number, number, number][] = samples.map(([u, v, hw], idx) => {
    const edgeFactor = idx === 0 || idx === samples.length - 1 ? tipTaper : 1;
    return [u, v, hw * edgeFactor];
  });

  const smooth = sampleCatmullRom(scaled, subdivisions);
  const left: PointUV[] = [];
  const right: PointUV[] = [];
  const centerStream: PointUV[] = [];
  const leftStream: PointUV[] = [];
  const rightStream: PointUV[] = [];

  for (let i = 0; i < smooth.length; i++) {
    const [u, v, w] = smooth[i];
    left.push(pt(u - w, v));
    right.unshift(pt(u + w, v));
    if (i > 0 && i < smooth.length - 1) {
      centerStream.push(pt(u, v));
      leftStream.push(pt(u - w * 0.45, v));
      rightStream.push(pt(u + w * 0.45, v));
    }
  }

  return {
    contours: [[...left, ...right]],
    detailPaths:
      centerStream.length >= 2
        ? [centerStream, leftStream, rightStream]
        : undefined
  };
}

/**
 * Generates fan/convergent muscle fascicle streamlines radiating from an origin edge
 * toward a concentrated insertion point.
 */
export function buildConvergentFascicles(
  origins: readonly PointUV[],
  insertion: PointUV
): PointUV[][] {
  return origins.map((orig) => {
    const midU = (orig[0] + insertion[0]) * 0.5;
    const midV = (orig[1] + insertion[1]) * 0.5;
    return [orig, pt(midU, midV), insertion];
  });
}

/**
 * Builds Rectus abdominis with 4 sculpted muscle segments separated by
 * 3 transverse tendinous intersections (intersectiones tendineae).
 */
export function buildRectusAbdominisGeometry(): MuscleGeometrySpec {
  // 4 distinct anatomical segments on one side (mirrored automatically via bilateral axial)
  const segments: readonly (readonly [number, number, number])[][] = [
    [
      [0.16, 0.385, 0.11],
      [0.18, 0.445, 0.132],
      [0.185, 0.505, 0.125]
    ],
    [
      [0.185, 0.518, 0.122],
      [0.19, 0.575, 0.135],
      [0.185, 0.630, 0.125]
    ],
    [
      [0.185, 0.642, 0.122],
      [0.18, 0.700, 0.128],
      [0.17, 0.758, 0.115]
    ],
    [
      [0.17, 0.770, 0.112],
      [0.155, 0.845, 0.102],
      [0.11, 0.935, 0.065]
    ]
  ];

  const contours: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];
  for (const seg of segments) {
    const built = buildOrganicMuscle(seg, 0.78, 2);
    contours.push(...built.contours);
    if (built.detailPaths) detailPaths.push(...built.detailPaths);
  }

  // 3 pearlescent tendinous intersections (rendered as silvery aponeurotic bands)
  const cartilageZones: PointUV[][] = [
    [pt(0.06, 0.502), pt(0.305, 0.496), pt(0.305, 0.520), pt(0.06, 0.524)],
    [pt(0.06, 0.628), pt(0.305, 0.622), pt(0.305, 0.644), pt(0.06, 0.648)],
    [pt(0.06, 0.756), pt(0.285, 0.750), pt(0.285, 0.772), pt(0.06, 0.776)]
  ];

  return { contours, cartilageZones, detailPaths };
}

/**
 * Builds Serratus anterior with 7 distinct serrated finger-like rib digitations.
 */
export function buildSerratusAnteriorGeometry(): MuscleGeometrySpec {
  const contours: PointUV[][] = [];
  const detailPaths: PointUV[][] = [];

  const slips = [
    { u0: 0.79, v0: 0.30, u1: 0.59, v1: 0.33 },
    { u0: 0.80, v0: 0.34, u1: 0.56, v1: 0.38 },
    { u0: 0.79, v0: 0.38, u1: 0.54, v1: 0.43 },
    { u0: 0.77, v0: 0.42, u1: 0.53, v1: 0.48 },
    { u0: 0.75, v0: 0.46, u1: 0.54, v1: 0.53 },
    { u0: 0.73, v0: 0.50, u1: 0.56, v1: 0.57 },
    { u0: 0.70, v0: 0.54, u1: 0.59, v1: 0.61 }
  ];

  for (const s of slips) {
    const midU = (s.u0 + s.u1) * 0.52;
    const midV = (s.v0 + s.v1) * 0.5 - 0.008;
    const hw = 0.017;
    contours.push([
      pt(s.u0, s.v0 - hw * 0.8),
      pt(midU, midV - hw * 1.1),
      pt(s.u1, s.v1 - hw * 0.45),
      pt(s.u1 - 0.015, s.v1 + hw * 0.45),
      pt(midU, midV + hw * 1.1),
      pt(s.u0, s.v0 + hw * 0.8)
    ]);
    detailPaths.push([pt(s.u0 - 0.02, s.v0), pt(midU, midV), pt(s.u1 + 0.02, s.v1)]);
  }

  return { contours, detailPaths };
}
