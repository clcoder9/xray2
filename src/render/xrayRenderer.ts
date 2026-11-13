import { ANATOMY_ARTWORK_REGISTRY } from '../assets/anatomyRegistry';
import type { StructureType } from '../data/anatomyData';
import type {
  FrameViewport,
  RenderedStructureInstance,
  ScreenPoint
} from '../vision/segmentRig';
import type { FocusCircle } from './focusSelector';
import { getDetectorPattern, getTrabecularPattern } from './xrayShaderCache';

export type DrawableMedia =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement;

export interface RenderFrameParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  media: DrawableMedia | null;
  viewport: FrameViewport;
  mirrored: boolean;
  layer: StructureType;
  circle: FocusCircle;
  structures: readonly RenderedStructureInstance[];
  ghostBones: readonly RenderedStructureInstance[];
  active: RenderedStructureInstance | null;
  speechCloudAnchor: ScreenPoint | null;
  isFrozen: boolean;
}

function appendSmoothSubpath(
  ctx: CanvasRenderingContext2D,
  pts: readonly ScreenPoint[]
): void {
  if (pts.length < 3) return;
  const firstMidX = (pts[pts.length - 1].x + pts[0].x) * 0.5;
  const firstMidY = (pts[pts.length - 1].y + pts[0].y) * 0.5;
  ctx.moveTo(firstMidX, firstMidY);
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const midX = (pts[i].x + next.x) * 0.5;
    const midY = (pts[i].y + next.y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.closePath();
}

function traceSmoothPolygon(
  ctx: CanvasRenderingContext2D,
  pts: readonly ScreenPoint[]
): void {
  ctx.beginPath();
  appendSmoothSubpath(ctx, pts);
}

function traceCompoundWithCutouts(
  ctx: CanvasRenderingContext2D,
  contours: readonly (readonly ScreenPoint[])[],
  cutouts: readonly (readonly ScreenPoint[])[]
): void {
  ctx.beginPath();
  for (const poly of contours) {
    appendSmoothSubpath(ctx, poly);
  }
  for (const hole of cutouts) {
    appendSmoothSubpath(ctx, hole);
  }
}

function traceOpenCurve(
  ctx: CanvasRenderingContext2D,
  pts: readonly ScreenPoint[]
): void {
  if (pts.length < 2) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    return;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) * 0.5;
    const midY = (pts[i].y + pts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

function traceContours(
  ctx: CanvasRenderingContext2D,
  contours: readonly (readonly ScreenPoint[])[]
): void {
  ctx.beginPath();
  for (const poly of contours) {
    appendSmoothSubpath(ctx, poly);
  }
}

function drawCartilageZones(
  ctx: CanvasRenderingContext2D,
  inst: RenderedStructureInstance,
  isActive: boolean,
  ghostOnly: boolean
): void {
  if (inst.cartilageZones.length === 0) return;

  ctx.save();
  traceContours(ctx, inst.cartilageZones);
  if (ghostOnly) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillStyle = isActive
    ? 'rgba(125, 211, 252, 0.34)'
    : 'rgba(56, 189, 248, 0.22)';
  ctx.fill();
  ctx.strokeStyle = isActive
    ? 'rgba(224, 242, 254, 0.62)'
    : 'rgba(125, 211, 252, 0.38)';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();
}

function drawBoneInstance(
  ctx: CanvasRenderingContext2D,
  inst: RenderedStructureInstance,
  isActive: boolean,
  ghostOnly: boolean
): void {
  if (inst.contours.length === 0) return;

  const { minX, minY, maxX, maxY } = inst.bounds;
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const w = Math.max(8, maxX - minX);
  const h = Math.max(8, maxY - minY);
  const span = Math.max(12, Math.hypot(w, h));

  if (ghostOnly) {
    traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
    ctx.fillStyle = 'rgba(148, 210, 255, 0.13)';
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.24)';
    ctx.lineWidth = 0.95;
    ctx.stroke();
    return;
  }

  // Pass 1: Beer-Lambert radiographic cortical/medullary attenuation
  // Cross-axis gradient creates bright dense cortical walls and darker translucent marrow core
  const crossRadius = Math.max(10, Math.min(w, h) * 0.54);
  const ux = inst.axisU.x;
  const uy = inst.axisU.y;
  const corticalGrad = ctx.createLinearGradient(
    cx - ux * crossRadius,
    cy - uy * crossRadius,
    cx + ux * crossRadius,
    cy + uy * crossRadius
  );
  if (isActive) {
    corticalGrad.addColorStop(0, 'rgba(240, 249, 255, 0.94)');
    corticalGrad.addColorStop(0.22, 'rgba(125, 211, 252, 0.80)');
    corticalGrad.addColorStop(0.5, 'rgba(30, 96, 145, 0.56)');
    corticalGrad.addColorStop(0.78, 'rgba(125, 211, 252, 0.80)');
    corticalGrad.addColorStop(1, 'rgba(240, 249, 255, 0.94)');
  } else {
    corticalGrad.addColorStop(0, 'rgba(224, 242, 254, 0.86)');
    corticalGrad.addColorStop(0.22, 'rgba(96, 185, 235, 0.68)');
    corticalGrad.addColorStop(0.5, 'rgba(14, 74, 110, 0.46)');
    corticalGrad.addColorStop(0.78, 'rgba(96, 185, 235, 0.68)');
    corticalGrad.addColorStop(1, 'rgba(224, 242, 254, 0.86)');
  }

  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
  ctx.save();
  ctx.shadowColor = isActive
    ? 'rgba(125, 211, 252, 0.95)'
    : 'rgba(56, 189, 248, 0.45)';
  ctx.shadowBlur = isActive ? 16 : 7;
  ctx.fillStyle = corticalGrad;
  ctx.fill('evenodd');
  ctx.restore();

  // Pass 1b: Subtle radial radiographic bone density bloom clipped to bone silhouette
  ctx.save();
  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
  ctx.clip('evenodd');

  const radGlow = ctx.createRadialGradient(
    cx - span * 0.06,
    cy - span * 0.06,
    span * 0.03,
    cx,
    cy,
    span * 0.62
  );
  radGlow.addColorStop(
    0,
    isActive ? 'rgba(255, 255, 255, 0.24)' : 'rgba(224, 242, 254, 0.16)'
  );
  radGlow.addColorStop(1, 'rgba(4, 15, 34, 0.18)');
  ctx.fillStyle = radGlow;
  ctx.fillRect(minX - 2, minY - 2, w + 4, h + 4);

  // Pass 2: Cancellous spongy trabecular lattice inside epiphyseal / flat bone zones
  if (inst.trabecularZones.length > 0) {
    const trabPattern = getTrabecularPattern(ctx, isActive);
    if (trabPattern) {
      ctx.save();
      traceContours(ctx, inst.trabecularZones);
      ctx.clip();
      ctx.fillStyle = trabPattern;
      ctx.fillRect(minX - 2, minY - 2, w + 4, h + 4);
      ctx.restore();
    }
  }

  // Pass 3: Osteological landmarks, sutures, dental crowns & medullary walls
  if (inst.detailPaths.length > 0) {
    ctx.strokeStyle = isActive
      ? 'rgba(254, 249, 195, 0.76)'
      : 'rgba(224, 242, 254, 0.56)';
    ctx.lineWidth = isActive ? 1.25 : 0.95;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (const dPath of inst.detailPaths) {
      traceOpenCurve(ctx, dPath);
    }
    ctx.stroke();
  }

  ctx.restore();

  // Pass 4: Dual-stage cortical bone wall highlight (outer periosteal rim + cutouts)
  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
  ctx.strokeStyle = isActive
    ? 'rgba(56, 189, 248, 0.62)'
    : 'rgba(125, 211, 252, 0.34)';
  ctx.lineWidth = isActive ? 3.8 : 2.3;
  ctx.stroke();

  ctx.strokeStyle = isActive ? '#fef08a' : 'rgba(240, 249, 255, 0.92)';
  ctx.lineWidth = isActive ? 2.1 : 1.15;
  ctx.stroke();
}

function drawMuscleInstance(
  ctx: CanvasRenderingContext2D,
  inst: RenderedStructureInstance,
  isActive: boolean
): void {
  if (inst.contours.length === 0) return;

  const art = ANATOMY_ARTWORK_REGISTRY.get(inst.structure.artworkRef);
  const layerDepth = inst.structure.layerOrder; // 1 deep, 2 mid, 3 superficial
  const { minX, minY, maxX, maxY } = inst.bounds;
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const w = Math.max(8, maxX - minX);
  const h = Math.max(8, maxY - minY);
  const span = Math.max(14, Math.hypot(w, h));

  const isFasciaOrTendon =
    inst.structure.id === 'm_tractus_iliotibialis' ||
    inst.structure.id === 'm_tendo_calcaneus' ||
    inst.structure.id === 'm_linea_alba' ||
    inst.structure.id === 'm_fascia_thoracolumbalis';

  // Pass 1: Volumetric red muscle belly or silvery fascia gradient (proximal -> distal)
  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);

  const grad = ctx.createLinearGradient(
    inst.proximalPt.x,
    inst.proximalPt.y,
    inst.distalPt.x,
    inst.distalPt.y
  );

  if (isFasciaOrTendon) {
    grad.addColorStop(
      0,
      isActive ? 'rgba(241, 245, 249, 0.94)' : 'rgba(226, 232, 240, 0.84)'
    );
    grad.addColorStop(
      0.5,
      isActive ? 'rgba(248, 250, 252, 0.98)' : 'rgba(203, 213, 225, 0.88)'
    );
    grad.addColorStop(1, 'rgba(226, 232, 240, 0.84)');
  } else {
    const proxT = Math.min(0.32, art?.tendonProximalRatio ?? 0.12);
    const distT = Math.max(0.68, 1 - (art?.tendonDistalRatio ?? 0.16));
    const baseAlpha = layerDepth === 1 ? 0.62 : layerDepth === 2 ? 0.78 : 0.9;
    const darkRed =
      layerDepth === 1
        ? `rgba(105, 18, 24, ${baseAlpha})`
        : `rgba(138, 22, 28, ${baseAlpha})`;
    const brightRed = isActive
      ? 'rgba(239, 68, 68, 0.95)'
      : layerDepth === 3
        ? `rgba(216, 48, 56, ${baseAlpha})`
        : `rgba(178, 34, 42, ${baseAlpha})`;

    grad.addColorStop(0, `rgba(226, 232, 240, ${baseAlpha * 0.92})`);
    grad.addColorStop(proxT, darkRed);
    grad.addColorStop(0.5, brightRed);
    grad.addColorStop(distT, darkRed);
    grad.addColorStop(1, `rgba(226, 232, 240, ${baseAlpha * 0.92})`);
  }

  ctx.fillStyle = grad;
  ctx.fill('evenodd');

  // Pass 2: Clipped 2.5D cylindrical volume, curved fascicles & tendinous intersections
  ctx.save();
  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
  ctx.clip('evenodd');

  // Cross-belly cylindrical 2.5D shading (ambient occlusion on edges, highlight ridge along belly)
  const bellyRadius = Math.max(8, Math.min(w, h) * 0.55);
  const ux = inst.axisU.x;
  const uy = inst.axisU.y;
  const volGrad = ctx.createLinearGradient(
    cx - ux * bellyRadius,
    cy - uy * bellyRadius,
    cx + ux * bellyRadius,
    cy + uy * bellyRadius
  );
  volGrad.addColorStop(0, 'rgba(15, 4, 8, 0.30)');
  volGrad.addColorStop(0.36, 'rgba(255, 255, 255, 0.16)');
  volGrad.addColorStop(0.62, 'rgba(255, 255, 255, 0.06)');
  volGrad.addColorStop(1, 'rgba(15, 4, 8, 0.32)');
  ctx.fillStyle = volGrad;
  ctx.fillRect(minX - 2, minY - 2, w + 4, h + 4);

  // Fine directional micro-striations
  const cos = Math.cos(inst.fiberScreenAngleRad);
  const sin = Math.sin(inst.fiberScreenAngleRad);
  const perpX = -sin;
  const perpY = cos;
  const stepPx = Math.max(3.8, Math.min(6.5, span * 0.048));
  const halfExtent = span * 0.72;

  ctx.strokeStyle = isFasciaOrTendon
    ? 'rgba(148, 163, 184, 0.32)'
    : isActive
      ? 'rgba(254, 202, 202, 0.38)'
      : 'rgba(254, 215, 215, 0.20)';
  ctx.lineWidth = isActive ? 0.95 : 0.75;
  ctx.beginPath();
  for (let offset = -halfExtent; offset <= halfExtent; offset += stepPx) {
    const ox = cx + perpX * offset;
    const oy = cy + perpY * offset;
    ctx.moveTo(ox - cos * halfExtent, oy - sin * halfExtent);
    ctx.lineTo(ox + cos * halfExtent, oy + sin * halfExtent);
  }
  ctx.stroke();

  // Organic curved fascicle streamlines & central pennate raphes
  if (inst.detailPaths.length > 0) {
    ctx.strokeStyle = isFasciaOrTendon
      ? 'rgba(248, 250, 252, 0.45)'
      : isActive
        ? 'rgba(254, 226, 226, 0.56)'
        : 'rgba(254, 202, 202, 0.34)';
    ctx.lineWidth = isActive ? 1.25 : 0.95;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const fPath of inst.detailPaths) {
      traceOpenCurve(ctx, fPath);
    }
    ctx.stroke();
  }

  // Pearlescent tendinous intersections (e.g., rectus abdominis intersectiones tendineae)
  if (inst.cartilageZones.length > 0) {
    traceContours(ctx, inst.cartilageZones);
    ctx.fillStyle = isActive
      ? 'rgba(248, 250, 252, 0.84)'
      : 'rgba(226, 232, 240, 0.74)';
    ctx.fill();
  }

  ctx.restore();

  // Pass 3: Crisp anatomical epimysium outline & active cyan diagnostic glow
  traceCompoundWithCutouts(ctx, inst.contours, inst.cutouts);
  if (isActive) {
    ctx.save();
    ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = 'rgba(69, 10, 10, 0.74)';
    ctx.lineWidth = 1.05;
    ctx.stroke();
  }
}

export function renderAnatomyFrame(params: RenderFrameParams): void {
  const {
    ctx,
    width,
    height,
    media,
    viewport,
    mirrored,
    layer,
    circle,
    structures,
    ghostBones,
    active,
    speechCloudAnchor,
    isFrozen
  } = params;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, width, height);

  // 1. Draw normal camera / input image across full viewport
  if (media) {
    ctx.save();
    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      const mirroredOffsetX = width - viewport.offsetX - viewport.drawWidth;
      ctx.drawImage(
        media,
        mirroredOffsetX,
        viewport.offsetY,
        viewport.drawWidth,
        viewport.drawHeight
      );
    } else {
      ctx.drawImage(
        media,
        viewport.offsetX,
        viewport.offsetY,
        viewport.drawWidth,
        viewport.drawHeight
      );
    }
    ctx.restore();
  }

  // 2. Inside the Focus Circle only: Clinical Dual-Energy Radiographic Chamber
  ctx.save();
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
  ctx.clip();

  // Deep clinical radiographic chamber gradient
  const chamberGrad = ctx.createRadialGradient(
    circle.cx,
    circle.cy,
    circle.radius * 0.1,
    circle.cx,
    circle.cy,
    circle.radius
  );
  if (layer === 'bone') {
    chamberGrad.addColorStop(0, 'rgba(6, 24, 52, 0.66)');
    chamberGrad.addColorStop(1, 'rgba(2, 8, 22, 0.80)');
  } else {
    chamberGrad.addColorStop(0, 'rgba(8, 16, 30, 0.56)');
    chamberGrad.addColorStop(1, 'rgba(3, 7, 16, 0.72)');
  }
  ctx.fillStyle = chamberGrad;
  ctx.fillRect(
    circle.cx - circle.radius,
    circle.cy - circle.radius,
    circle.radius * 2,
    circle.radius * 2
  );

  // Cached flat-panel medical X-ray detector pattern
  const detPattern = getDetectorPattern(ctx);
  if (detPattern) {
    ctx.fillStyle = detPattern;
    ctx.fillRect(
      circle.cx - circle.radius,
      circle.cy - circle.radius,
      circle.radius * 2,
      circle.radius * 2
    );
  }

  if (layer === 'muscle') {
    // Faint cohesive skeletal landmarks for anatomical orientation
    for (const bone of ghostBones) {
      drawCartilageZones(ctx, bone, false, true);
      drawBoneInstance(ctx, bone, false, true);
    }
    // Non-active muscles first, then active muscle on top
    for (const inst of structures) {
      if (active && inst.instanceId === active.instanceId) continue;
      drawMuscleInstance(ctx, inst, false);
    }
    if (active) {
      drawMuscleInstance(ctx, active, true);
    }
  } else {
    // Cohesive articulated cartilage/disc underlay (intervertebral discs, costal cartilages, symphysis)
    for (const inst of structures) {
      drawCartilageZones(
        ctx,
        inst,
        Boolean(active && inst.instanceId === active.instanceId),
        false
      );
    }
    for (const inst of structures) {
      if (active && inst.instanceId === active.instanceId) continue;
      drawBoneInstance(ctx, inst, false, false);
    }
    if (active) {
      drawBoneInstance(ctx, active, true, false);
    }
  }

  // Radial inner lens vignette
  const lensVignette = ctx.createRadialGradient(
    circle.cx,
    circle.cy,
    circle.radius * 0.62,
    circle.cx,
    circle.cy,
    circle.radius
  );
  lensVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  lensVignette.addColorStop(1, 'rgba(2, 6, 18, 0.62)');
  ctx.fillStyle = lensVignette;
  ctx.fillRect(
    circle.cx - circle.radius,
    circle.cy - circle.radius,
    circle.radius * 2,
    circle.radius * 2
  );

  ctx.restore();

  // 3. Leader line & target marker from focused structure to Speech Cloud
  if (active) {
    const dx = active.anchor.x - circle.cx;
    const dy = active.anchor.y - circle.cy;
    const d = Math.hypot(dx, dy);
    const markerPt: ScreenPoint =
      d > circle.radius - 6
        ? {
            x: circle.cx + (dx / d) * (circle.radius - 6),
            y: circle.cy + (dy / d) * (circle.radius - 6)
          }
        : active.anchor;

    if (speechCloudAnchor) {
      ctx.save();
      ctx.strokeStyle =
        layer === 'muscle'
          ? 'rgba(34, 211, 238, 0.92)'
          : 'rgba(250, 204, 21, 0.92)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(markerPt.x, markerPt.y);
      ctx.lineTo(speechCloudAnchor.x, speechCloudAnchor.y);
      ctx.stroke();
      ctx.restore();
    }

    // Target reticle dot on focused structure
    ctx.save();
    ctx.fillStyle = layer === 'muscle' ? '#22d3ee' : '#facc15';
    ctx.strokeStyle = '#060a12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(markerPt.x, markerPt.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 4. Focus Circle Bezel, Collimator Calibration Ticks, Crosshair & Resize Handle
  ctx.save();
  ctx.strokeStyle = isFrozen
    ? 'rgba(125, 211, 252, 0.95)'
    : 'rgba(56, 189, 248, 0.92)';
  ctx.lineWidth = 2.6;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.58)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Subtle collimator calibration ticks along inner lens bezel
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const tickLen = i % 6 === 0 ? 7 : 3.5;
    const r0 = circle.radius - 2;
    const r1 = circle.radius - 2 - tickLen;
    ctx.moveTo(circle.cx + Math.cos(ang) * r0, circle.cy + Math.sin(ang) * r0);
    ctx.lineTo(circle.cx + Math.cos(ang) * r1, circle.cy + Math.sin(ang) * r1);
  }
  ctx.stroke();

  // Subtle center crosshair inside the focus circle
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.48)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(circle.cx - 8, circle.cy);
  ctx.lineTo(circle.cx + 8, circle.cy);
  ctx.moveTo(circle.cx, circle.cy - 8);
  ctx.lineTo(circle.cx, circle.cy + 8);
  ctx.stroke();

  // 45-degree bottom-right resize handle indicator
  const hx = circle.cx + Math.SQRT1_2 * circle.radius;
  const hy = circle.cy + Math.SQRT1_2 * circle.radius;
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(hx, hy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Small diagonal arrows inside resize handle
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy - 4);
  ctx.lineTo(hx + 4, hy + 4);
  ctx.moveTo(hx + 1, hy + 4);
  ctx.lineTo(hx + 4, hy + 4);
  ctx.lineTo(hx + 4, hy + 1);
  ctx.stroke();
  ctx.restore();
}

export { traceContours, traceSmoothPolygon };
