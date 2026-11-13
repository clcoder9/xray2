import { ANATOMY_ARTWORK_REGISTRY } from '../assets/anatomyRegistry';
import type { StructureType } from '../data/anatomyData';
import type {
  FrameViewport,
  RenderedStructureInstance,
  ScreenPoint
} from '../vision/segmentRig';
import type { FocusCircle } from './focusSelector';

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

function traceSmoothPolygon(
  ctx: CanvasRenderingContext2D,
  pts: readonly ScreenPoint[]
): void {
  if (pts.length < 3) return;
  ctx.beginPath();
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

function traceContours(
  ctx: CanvasRenderingContext2D,
  contours: readonly (readonly ScreenPoint[])[]
): void {
  for (const poly of contours) {
    traceSmoothPolygon(ctx, poly);
  }
}

function drawBoneInstance(
  ctx: CanvasRenderingContext2D,
  inst: RenderedStructureInstance,
  isActive: boolean,
  ghostOnly: boolean
): void {
  const { minX, minY, maxX, maxY } = inst.bounds;
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const span = Math.max(12, Math.hypot(maxX - minX, maxY - minY));

  for (const poly of inst.contours) {
    traceSmoothPolygon(ctx, poly);
    if (ghostOnly) {
      ctx.fillStyle = 'rgba(148, 210, 255, 0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      continue;
    }

    // Blue-white X-ray radiographic bone gradient
    const grad = ctx.createRadialGradient(
      cx - span * 0.08,
      cy - span * 0.08,
      span * 0.04,
      cx,
      cy,
      span * 0.65
    );
    grad.addColorStop(0, isActive ? 'rgba(240, 249, 255, 0.94)' : 'rgba(224, 242, 254, 0.84)');
    grad.addColorStop(0.55, isActive ? 'rgba(125, 211, 252, 0.82)' : 'rgba(56, 189, 248, 0.66)');
    grad.addColorStop(1, 'rgba(14, 116, 144, 0.45)');

    ctx.save();
    ctx.shadowColor = isActive ? 'rgba(125, 211, 252, 0.95)' : 'rgba(56, 189, 248, 0.55)';
    ctx.shadowBlur = isActive ? 16 : 8;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Cortical bone bright rim
    ctx.strokeStyle = isActive ? '#fef08a' : 'rgba(224, 242, 254, 0.92)';
    ctx.lineWidth = isActive ? 2.6 : 1.35;
    ctx.stroke();

    // Inner medullary canal highlight
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(1.5, span * 0.035);
    ctx.beginPath();
    ctx.moveTo(inst.proximalPt.x, inst.proximalPt.y);
    ctx.lineTo(inst.distalPt.x, inst.distalPt.y);
    ctx.stroke();
    ctx.restore();
  }
}

function drawMuscleInstance(
  ctx: CanvasRenderingContext2D,
  inst: RenderedStructureInstance,
  isActive: boolean
): void {
  const art = ANATOMY_ARTWORK_REGISTRY.get(inst.structure.artworkRef);
  const layerDepth = inst.structure.layerOrder; // 1 deep, 2 mid, 3 superficial
  const { minX, minY, maxX, maxY } = inst.bounds;
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const span = Math.max(14, Math.hypot(maxX - minX, maxY - minY));

  const isFasciaOrTendon =
    inst.structure.id === 'm_tractus_iliotibialis' ||
    inst.structure.id === 'm_tendo_calcaneus' ||
    inst.structure.id === 'm_linea_alba' ||
    inst.structure.id === 'm_fascia_thoracolumbalis';

  for (const poly of inst.contours) {
    traceSmoothPolygon(ctx, poly);

    // Volumetric red muscle belly or silvery fascia gradient along proximal -> distal axis
    const grad = ctx.createLinearGradient(
      inst.proximalPt.x,
      inst.proximalPt.y,
      inst.distalPt.x,
      inst.distalPt.y
    );

    if (isFasciaOrTendon) {
      grad.addColorStop(0, isActive ? 'rgba(241, 245, 249, 0.92)' : 'rgba(226, 232, 240, 0.82)');
      grad.addColorStop(0.5, isActive ? 'rgba(248, 250, 252, 0.96)' : 'rgba(203, 213, 225, 0.85)');
      grad.addColorStop(1, 'rgba(226, 232, 240, 0.82)');
    } else {
      const proxT = Math.min(0.32, art?.tendonProximalRatio ?? 0.12);
      const distT = Math.max(0.68, 1 - (art?.tendonDistalRatio ?? 0.16));
      const baseAlpha = layerDepth === 1 ? 0.58 : layerDepth === 2 ? 0.75 : 0.88;
      const darkRed =
        layerDepth === 1
          ? `rgba(105, 18, 24, ${baseAlpha})`
          : `rgba(135, 22, 28, ${baseAlpha})`;
      const brightRed = isActive
        ? `rgba(239, 68, 68, 0.94)`
        : layerDepth === 3
          ? `rgba(212, 46, 52, ${baseAlpha})`
          : `rgba(176, 34, 40, ${baseAlpha})`;

      grad.addColorStop(0, `rgba(226, 232, 240, ${baseAlpha * 0.92})`);
      grad.addColorStop(proxT, darkRed);
      grad.addColorStop(0.5, brightRed);
      grad.addColorStop(distT, darkRed);
      grad.addColorStop(1, `rgba(226, 232, 240, ${baseAlpha * 0.92})`);
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Muscle fiber striations clipped strictly to the muscle contour
    ctx.save();
    ctx.clip();

    // Directional fiber lines
    const cos = Math.cos(inst.fiberScreenAngleRad);
    const sin = Math.sin(inst.fiberScreenAngleRad);
    const perpX = -sin;
    const perpY = cos;
    const stepPx = Math.max(3.6, Math.min(6.5, span * 0.048));
    const halfExtent = span * 0.72;

    ctx.strokeStyle = isFasciaOrTendon
      ? 'rgba(148, 163, 184, 0.35)'
      : isActive
        ? 'rgba(254, 202, 202, 0.48)'
        : 'rgba(254, 215, 215, 0.28)';
    ctx.lineWidth = isActive ? 1.1 : 0.85;
    ctx.beginPath();
    for (let offset = -halfExtent; offset <= halfExtent; offset += stepPx) {
      const ox = cx + perpX * offset;
      const oy = cy + perpY * offset;
      ctx.moveTo(ox - cos * halfExtent, oy - sin * halfExtent);
      ctx.lineTo(ox + cos * halfExtent, oy + sin * halfExtent);
    }
    ctx.stroke();

    // Specular 2.5D belly highlight
    const spec = ctx.createRadialGradient(
      cx - span * 0.1,
      cy - span * 0.1,
      span * 0.04,
      cx,
      cy,
      span * 0.55
    );
    spec.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    spec.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = spec;
    ctx.fillRect(minX - 2, minY - 2, maxX - minX + 4, maxY - minY + 4);

    ctx.restore();

    // Crisp anatomical epimysium outline
    traceSmoothPolygon(ctx, poly);
    if (isActive) {
      ctx.save();
      ctx.shadowColor = 'rgba(34, 211, 238, 0.95)';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(69, 10, 10, 0.72)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
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

  // 2. Inside the Focus Circle only: X-Ray radiographic view
  ctx.save();
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
  ctx.clip();

  // Radiographic dark-blue tint & contrast darkening inside lens
  ctx.fillStyle =
    layer === 'bone' ? 'rgba(4, 15, 34, 0.68)' : 'rgba(8, 12, 22, 0.56)';
  ctx.fillRect(
    circle.cx - circle.radius,
    circle.cy - circle.radius,
    circle.radius * 2,
    circle.radius * 2
  );

  // Subtle X-ray scan grid inside lens
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  const gridStep = 28;
  ctx.beginPath();
  for (
    let gx = Math.floor((circle.cx - circle.radius) / gridStep) * gridStep;
    gx <= circle.cx + circle.radius;
    gx += gridStep
  ) {
    ctx.moveTo(gx, circle.cy - circle.radius);
    ctx.lineTo(gx, circle.cy + circle.radius);
  }
  for (
    let gy = Math.floor((circle.cy - circle.radius) / gridStep) * gridStep;
    gy <= circle.cy + circle.radius;
    gy += gridStep
  ) {
    ctx.moveTo(circle.cx - circle.radius, gy);
    ctx.lineTo(circle.cx + circle.radius, gy);
  }
  ctx.stroke();

  if (layer === 'muscle') {
    // Faint underlying skeletal landmarks for anatomical orientation
    for (const bone of ghostBones) {
      drawBoneInstance(ctx, bone, false, true);
    }
    // Render non-active muscles first, then active muscle on top
    for (const inst of structures) {
      if (active && inst.instanceId === active.instanceId) continue;
      drawMuscleInstance(ctx, inst, false);
    }
    if (active) {
      drawMuscleInstance(ctx, active, true);
    }
  } else {
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
  lensVignette.addColorStop(1, 'rgba(2, 6, 18, 0.58)');
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
    // Clamp anchor visual marker cleanly inside circle if anchor lies slightly outside
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
      ctx.strokeStyle = layer === 'muscle' ? 'rgba(34, 211, 238, 0.92)' : 'rgba(250, 204, 21, 0.92)';
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

  // 4. Focus Circle Rim, Crosshair & Resize Handle
  ctx.save();
  ctx.strokeStyle = isFrozen
    ? 'rgba(125, 211, 252, 0.95)'
    : 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Subtle center crosshair inside the focus circle
  ctx.save();
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
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

// Keep unused export check clean for future external SVG renderer extensions
export { traceContours };
