import type { PoseLandmark } from './types';

function smoothingFactor(te: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * te;
  return r / (r + 1);
}

function exponentialSmoothing(a: number, x: number, xPrev: number): number {
  return a * x + (1 - a) * xPrev;
}

/**
 * 1€ Filter (Casiez et al., CHI 2012) for low-latency jitter elimination
 * on real-time pose landmarks.
 */
export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(minCutoff = 1.15, beta = 0.045, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  filter(x: number, timestampSec: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestampSec;
      return x;
    }

    const te = Math.max(1e-4, timestampSec - this.tPrev);
    // Reset filter if stream paused or jumped significantly (> 0.5s)
    if (te > 0.5) {
      this.xPrev = x;
      this.dxPrev = 0;
      this.tPrev = timestampSec;
      return x;
    }

    const aD = smoothingFactor(te, this.dCutoff);
    const dx = (x - this.xPrev) / te;
    const dxHat = exponentialSmoothing(aD, dx, this.dxPrev);

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = smoothingFactor(te, cutoff);
    const xHat = exponentialSmoothing(a, x, this.xPrev);

    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = timestampSec;
    return xHat;
  }
}

interface LandmarkFilterTriplet {
  x: OneEuroFilter;
  y: OneEuroFilter;
  z: OneEuroFilter;
  vis: OneEuroFilter;
}

/**
 * Maintains independent 1€ filters across all 33 MediaPipe pose landmarks.
 */
export class LandmarkSmoother {
  private readonly filters: LandmarkFilterTriplet[] = [];
  private readonly minCutoff: number;
  private readonly beta: number;

  constructor(landmarkCount = 33, minCutoff = 1.15, beta = 0.045) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    for (let i = 0; i < landmarkCount; i++) {
      this.filters.push({
        x: new OneEuroFilter(this.minCutoff, this.beta),
        y: new OneEuroFilter(this.minCutoff, this.beta),
        z: new OneEuroFilter(this.minCutoff * 0.8, this.beta * 0.6),
        vis: new OneEuroFilter(2.5, 0.0)
      });
    }
  }

  reset(): void {
    for (const f of this.filters) {
      f.x.reset();
      f.y.reset();
      f.z.reset();
      f.vis.reset();
    }
  }

  smooth(landmarks: readonly PoseLandmark[], timestampMs: number): PoseLandmark[] {
    const tSec = timestampMs / 1000;
    return landmarks.map((lm, i) => {
      const f = this.filters[i];
      if (!f) return { ...lm };
      const rawVis = lm.visibility ?? 1;
      return {
        x: f.x.filter(lm.x, tSec),
        y: f.y.filter(lm.y, tSec),
        z: f.z.filter(lm.z, tSec),
        visibility: Math.max(0, Math.min(1, f.vis.filter(rawVis, tSec)))
      };
    });
  }
}
