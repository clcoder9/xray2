import { describe, expect, it } from 'vitest';
import { getDevSampleLandmarks } from '../../src/vision/devFixtures';
import {
  OrientationDetector,
  computeOrientationScore
} from '../../src/vision/orientationDetector';
import { MP_LANDMARK } from '../../src/vision/types';

describe('OrientationDetector front/back detection & hysteresis', () => {
  it('computes positive score for front-facing landmarks and negative for back-facing landmarks', () => {
    const front = getDevSampleLandmarks('anterior');
    const back = getDevSampleLandmarks('posterior');

    expect(computeOrientationScore(front)).toBeGreaterThan(0.5);
    expect(computeOrientationScore(back)).toBeLessThan(-0.5);
  });

  it('switches cleanly from front to back after sustained frames and back again', () => {
    const detector = new OrientationDetector({
      initialView: 'front',
      alpha: 0.4,
      hysteresisThreshold: 0.25,
      requiredFrames: 4
    });

    const front = getDevSampleLandmarks('anterior');
    const back = getDevSampleLandmarks('posterior');

    expect(detector.update(front, 'auto').view).toBe('front');

    // Feed posterior frames until hysteresis latches to 'back'
    let current = 'front';
    for (let i = 0; i < 10; i++) {
      current = detector.update(back, 'auto').view;
    }
    expect(current).toBe('back');

    // Feed anterior frames until hysteresis latches back to 'front'
    for (let i = 0; i < 10; i++) {
      current = detector.update(front, 'auto').view;
    }
    expect(current).toBe('front');
  });

  it('prevents flickering on brief oblique / noisy frames near threshold', () => {
    const detector = new OrientationDetector({
      initialView: 'front',
      alpha: 0.28,
      hysteresisThreshold: 0.25,
      requiredFrames: 4
    });

    const front = getDevSampleLandmarks('anterior');
    const back = getDevSampleLandmarks('posterior');

    // Establish strong front state
    for (let i = 0; i < 6; i++) detector.update(front, 'auto');

    // Side-on oblique pose (shoulders almost aligned, low signal)
    const oblique = front.map((lm) => ({ ...lm }));
    oblique[MP_LANDMARK.LEFT_SHOULDER].x = 0.505;
    oblique[MP_LANDMARK.RIGHT_SHOULDER].x = 0.495;
    oblique[MP_LANDMARK.NOSE].visibility = 0.45;

    for (let i = 0; i < 8; i++) {
      expect(detector.update(oblique, 'auto').view).toBe('front');
    }

    // Single noisy back frame should NOT flip view immediately
    expect(detector.update(back, 'auto').view).toBe('front');
  });

  it('respects manual front/back overrides immediately', () => {
    const detector = new OrientationDetector({ initialView: 'front' });
    const front = getDevSampleLandmarks('anterior');

    expect(detector.update(front, 'back').view).toBe('back');
    expect(detector.update(front, 'front').view).toBe('front');
  });
});
