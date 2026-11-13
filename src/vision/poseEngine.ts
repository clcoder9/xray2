import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { selectPrimaryPerson } from './personSelector';
import type { PoseLandmark } from './types';

export type PoseModelTier = 'full' | 'lite';

export interface PoseEngineStatus {
  ready: boolean;
  loading: boolean;
  modelTier: PoseModelTier;
  backend: 'mediapipe' | 'fixture-fallback';
  error: string | null;
}

const MODEL_PATHS: Record<PoseModelTier, string> = {
  full: './models/pose_landmarker_full.task',
  lite: './models/pose_landmarker_lite.task'
};

const WASM_PATH = './models/wasm';

/**
 * Manages on-device MediaPipe PoseLandmarker loaded strictly from local
 * bundled WASM and .task model files (zero CDN requests).
 */
export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private currentMode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private modelTier: PoseModelTier = 'full';
  private loading = false;
  private initError: string | null = null;
  private lastVideoTimestampMs = -1;

  getStatus(): PoseEngineStatus {
    return {
      ready: this.landmarker !== null,
      loading: this.loading,
      modelTier: this.modelTier,
      backend: this.landmarker ? 'mediapipe' : 'fixture-fallback',
      error: this.initError
    };
  }

  getModelTier(): PoseModelTier {
    return this.modelTier;
  }

  async init(
    tier: PoseModelTier = 'full',
    runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO'
  ): Promise<boolean> {
    if (
      this.landmarker &&
      this.modelTier === tier &&
      this.currentMode === runningMode
    ) {
      return true;
    }

    this.loading = true;
    this.initError = null;
    try {
      this.dispose();
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      let landmarker: PoseLandmarker;
      try {
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[tier],
            delegate: 'GPU'
          },
          runningMode,
          numPoses: 3,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      } catch {
        // Fallback to CPU delegate if WebGL GPU delegate is unavailable
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATHS[tier],
            delegate: 'CPU'
          },
          runningMode,
          numPoses: 3,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      }
      this.landmarker = landmarker;
      this.modelTier = tier;
      this.currentMode = runningMode;
      this.lastVideoTimestampMs = -1;
      this.loading = false;
      return true;
    } catch (err) {
      this.initError = err instanceof Error ? err.message : String(err);
      this.loading = false;
      return false;
    }
  }

  async switchModelTier(tier: PoseModelTier): Promise<boolean> {
    if (tier === this.modelTier && this.landmarker) return true;
    return this.init(tier, this.currentMode);
  }

  async ensureMode(mode: 'IMAGE' | 'VIDEO'): Promise<boolean> {
    if (this.landmarker && this.currentMode === mode) return true;
    if (!this.landmarker) {
      return this.init(this.modelTier, mode);
    }
    try {
      await this.landmarker.setOptions({ runningMode: mode });
      this.currentMode = mode;
      this.lastVideoTimestampMs = -1;
      return true;
    } catch {
      return this.init(this.modelTier, mode);
    }
  }

  detectImage(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap
  ): PoseLandmark[] | null {
    if (!this.landmarker || this.currentMode !== 'IMAGE') return null;
    try {
      const result = this.landmarker.detect(source);
      return selectPrimaryPerson(result.landmarks ?? []);
    } catch {
      return null;
    }
  }

  detectVideoFrame(
    source: HTMLVideoElement | HTMLCanvasElement,
    timestampMs: number
  ): PoseLandmark[] | null {
    if (!this.landmarker || this.currentMode !== 'VIDEO') return null;
    const monotonicTs =
      timestampMs <= this.lastVideoTimestampMs
        ? this.lastVideoTimestampMs + 1
        : timestampMs;
    this.lastVideoTimestampMs = monotonicTs;
    try {
      const result = this.landmarker.detectForVideo(source, monotonicTs);
      return selectPrimaryPerson(result.landmarks ?? []);
    } catch {
      return null;
    }
  }

  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch {
        // Ignore close errors during disposal
      }
      this.landmarker = null;
    }
  }
}
