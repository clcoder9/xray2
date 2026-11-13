interface CachedPatterns {
  trabecularIdle: CanvasPattern | null;
  trabecularActive: CanvasPattern | null;
  detector: CanvasPattern | null;
}

const patternCache = new WeakMap<CanvasRenderingContext2D, CachedPatterns>();

function createTrabecularTile(isActive: boolean): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const tctx = canvas.getContext('2d');
  if (!tctx) return null;

  // Organic spongy cancellous lattice (seamless 3x3 wraparound)
  const nodes: [number, number][] = [
    [8, 10],
    [26, 6],
    [46, 12],
    [58, 22],
    [14, 28],
    [34, 24],
    [50, 38],
    [10, 48],
    [28, 44],
    [42, 56],
    [58, 54],
    [20, 58]
  ];

  const links: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 5], [3, 6],
    [4, 5], [5, 6], [4, 7], [4, 8], [5, 8], [6, 9], [6, 10],
    [7, 8], [8, 9], [9, 10], [7, 11], [8, 11], [9, 11],
    // Seamless wraparound connections
    [3, 0], [10, 7], [11, 1], [6, 4]
  ];

  tctx.lineCap = 'round';
  tctx.strokeStyle = isActive
    ? 'rgba(224, 242, 254, 0.34)'
    : 'rgba(186, 230, 253, 0.25)';
  tctx.lineWidth = 1.15;

  for (const [aIdx, bIdx] of links) {
    const a = nodes[aIdx];
    const b = nodes[bIdx];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    if (dx > size * 0.5) dx -= size;
    if (dx < -size * 0.5) dx += size;
    if (dy > size * 0.5) dy -= size;
    if (dy < -size * 0.5) dy += size;

    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const sx = a[0] + ox;
        const sy = a[1] + oy;
        const ex = sx + dx;
        const ey = sy + dy;
        if (
          Math.max(sx, ex) < -4 ||
          Math.min(sx, ex) > size + 4 ||
          Math.max(sy, ey) < -4 ||
          Math.min(sy, ey) > size + 4
        ) {
          continue;
        }
        tctx.beginPath();
        tctx.moveTo(sx, sy);
        tctx.quadraticCurveTo(
          (sx + ex) * 0.5 + (dy * 0.14),
          (sy + ey) * 0.5 - (dx * 0.14),
          ex,
          ey
        );
        tctx.stroke();
      }
    }
  }

  // Fine mineral marrow pores
  tctx.fillStyle = isActive
    ? 'rgba(12, 74, 110, 0.28)'
    : 'rgba(8, 47, 73, 0.26)';
  for (let i = 0; i < nodes.length; i++) {
    const [nx, ny] = nodes[i];
    tctx.beginPath();
    tctx.arc((nx + 7) % size, (ny + 9) % size, 1.8, 0, Math.PI * 2);
    tctx.fill();
  }

  return canvas;
}

function createDetectorTile(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const dctx = canvas.getContext('2d');
  if (!dctx) return null;

  // Subtle flat-panel digital radiography grid + micro-grain
  dctx.strokeStyle = 'rgba(56, 189, 248, 0.055)';
  dctx.lineWidth = 1;
  dctx.beginPath();
  dctx.moveTo(0.5, 0);
  dctx.lineTo(0.5, size);
  dctx.moveTo(0, 0.5);
  dctx.lineTo(size, 0.5);
  dctx.stroke();

  // Horizontal scanline micro-bands
  dctx.fillStyle = 'rgba(186, 230, 253, 0.018)';
  for (let y = 0; y < size; y += 4) {
    dctx.fillRect(0, y, size, 1);
  }

  // Deterministic pseudo-random detector grain
  let seed = 1337;
  for (let i = 0; i < 64; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = seed % size;
    seed = (seed * 16807) % 2147483647;
    const y = seed % size;
    dctx.fillStyle = i % 2 === 0 ? 'rgba(186, 230, 253, 0.03)' : 'rgba(2, 6, 23, 0.05)';
    dctx.fillRect(x, y, 1, 1);
  }

  return canvas;
}

function getOrCreateCache(ctx: CanvasRenderingContext2D): CachedPatterns {
  let entry = patternCache.get(ctx);
  if (!entry) {
    const trabIdleCanvas = createTrabecularTile(false);
    const trabActiveCanvas = createTrabecularTile(true);
    const detCanvas = createDetectorTile();

    entry = {
      trabecularIdle: trabIdleCanvas ? ctx.createPattern(trabIdleCanvas, 'repeat') : null,
      trabecularActive: trabActiveCanvas ? ctx.createPattern(trabActiveCanvas, 'repeat') : null,
      detector: detCanvas ? ctx.createPattern(detCanvas, 'repeat') : null
    };
    patternCache.set(ctx, entry);
  }
  return entry;
}

export function getTrabecularPattern(
  ctx: CanvasRenderingContext2D,
  isActive: boolean
): CanvasPattern | null {
  const entry = getOrCreateCache(ctx);
  return isActive ? entry.trabecularActive : entry.trabecularIdle;
}

export function getDetectorPattern(
  ctx: CanvasRenderingContext2D
): CanvasPattern | null {
  return getOrCreateCache(ctx).detector;
}
