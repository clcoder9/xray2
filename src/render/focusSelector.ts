import type { RenderedStructureInstance, ScreenPoint } from '../vision/segmentRig';

export interface FocusCircle {
  cx: number;
  cy: number;
  radius: number;
}

export interface FocusSelectionResult {
  active: RenderedStructureInstance | null;
  isPinned: boolean;
  overlapping: RenderedStructureInstance[];
}

export function isPointInPolygon(
  px: number,
  py: number,
  poly: readonly ScreenPoint[]
): boolean {
  if (poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInStructure(
  px: number,
  py: number,
  instance: RenderedStructureInstance
): boolean {
  const { minX, minY, maxX, maxY } = instance.bounds;
  if (px < minX || px > maxX || py < minY || py > maxY) return false;
  return instance.contours.some((poly) => isPointInPolygon(px, py, poly));
}

function circleIntersectsBounds(
  circle: FocusCircle,
  bounds: RenderedStructureInstance['bounds']
): boolean {
  const closestX = Math.max(bounds.minX, Math.min(circle.cx, bounds.maxX));
  const closestY = Math.max(bounds.minY, Math.min(circle.cy, bounds.maxY));
  return Math.hypot(circle.cx - closestX, circle.cy - closestY) <= circle.radius;
}

/**
 * Finds the topmost anatomical structure under a tap/click coordinate inside
 * the focus circle. Returns null if the tap is outside the circle or hits empty space.
 */
export function findStructureAtPoint(
  instances: readonly RenderedStructureInstance[],
  circle: FocusCircle,
  tapX: number,
  tapY: number
): RenderedStructureInstance | null {
  if (Math.hypot(tapX - circle.cx, tapY - circle.cy) > circle.radius) {
    return null;
  }

  // Prefer structures directly containing the tap point, highest layerOrder first
  const directHits = instances.filter((inst) =>
    isPointInStructure(tapX, tapY, inst)
  );
  if (directHits.length > 0) {
    directHits.sort((a, b) => {
      if (b.structure.layerOrder !== a.structure.layerOrder) {
        return b.structure.layerOrder - a.structure.layerOrder;
      }
      const da = Math.hypot(a.anchor.x - tapX, a.anchor.y - tapY);
      const db = Math.hypot(b.anchor.x - tapX, b.anchor.y - tapY);
      return da - db;
    });
    return directHits[0];
  }

  // Soft fallback: nearest anchor within 30px inside circle
  let nearest: RenderedStructureInstance | null = null;
  let bestDist = 30;
  for (const inst of instances) {
    const d = Math.hypot(inst.anchor.x - tapX, inst.anchor.y - tapY);
    if (d < bestDist) {
      bestDist = d;
      nearest = inst;
    }
  }
  return nearest;
}

/**
 * Selects the structure in focus (honoring a pinned instanceId if still valid
 * and visible inside/near the lens, otherwise picking the structure closest to
 * the focus circle center) plus up to 4 overlapping/adjacent candidates.
 */
export function selectFocusedStructure(
  instances: readonly RenderedStructureInstance[],
  circle: FocusCircle,
  pinnedInstanceId: string | null
): FocusSelectionResult {
  if (instances.length === 0) {
    return { active: null, isPinned: false, overlapping: [] };
  }

  // Candidate structures intersecting the focus circle
  const candidates = instances.filter((inst) => {
    const anchorDist = Math.hypot(
      inst.anchor.x - circle.cx,
      inst.anchor.y - circle.cy
    );
    return (
      anchorDist <= circle.radius * 1.1 ||
      circleIntersectsBounds(circle, inst.bounds)
    );
  });

  if (candidates.length === 0) {
    return { active: null, isPinned: false, overlapping: [] };
  }

  const scored = candidates
    .map((inst) => {
      const anchorDist = Math.hypot(
        inst.anchor.x - circle.cx,
        inst.anchor.y - circle.cy
      );
      const containsCenter = isPointInStructure(circle.cx, circle.cy, inst);
      // Center-containment strongly prioritizes superficial/direct hit over distant anchors
      const score = containsCenter
        ? anchorDist * 0.25 - inst.structure.layerOrder * 6
        : anchorDist + (3 - inst.structure.layerOrder) * 4;
      return { inst, anchorDist, containsCenter, score };
    })
    .sort((a, b) => a.score - b.score);

  let active = scored[0].inst;
  let isPinned = false;

  if (pinnedInstanceId) {
    const pinnedMatch = candidates.find(
      (inst) => inst.instanceId === pinnedInstanceId
    );
    if (pinnedMatch) {
      active = pinnedMatch;
      isPinned = true;
    }
  }

  // Build overlapping / adjacent switcher chips (up to 4 structures near center or active anchor)
  const overlapPool = scored
    .filter(
      (entry) =>
        entry.containsCenter ||
        entry.anchorDist <= circle.radius * 0.72 ||
        Math.hypot(
          entry.inst.anchor.x - active.anchor.x,
          entry.inst.anchor.y - active.anchor.y
        ) <= circle.radius * 0.6
    )
    .map((entry) => entry.inst);

  const overlapping: RenderedStructureInstance[] = [];
  if (!overlapPool.some((x) => x.instanceId === active.instanceId)) {
    overlapping.push(active);
  }
  for (const item of overlapPool) {
    if (overlapping.length >= 4) break;
    if (!overlapping.some((x) => x.instanceId === item.instanceId)) {
      overlapping.push(item);
    }
  }

  return {
    active,
    isPinned,
    overlapping: overlapping.length > 1 ? overlapping : []
  };
}
