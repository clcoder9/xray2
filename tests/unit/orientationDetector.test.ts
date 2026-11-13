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

  it('respects manual front/back/left/right overrides immediately', () => {
    const detector = new OrientationDetector({ initialView: 'front' });
    const front = getDevSampleLandmarks('anterior');

    expect(detector.update(front, 'back').view).toBe('back');
    expect(detector.update(front, 'left').view).toBe('left');
    expect(detector.update(front, 'right').view).toBe('right');
    expect(detector.update(front, 'front').view).toBe('front');
  });

  it('detects left lateral body view and mirrored right lateral body view', () => {
    const detectorLeft = new OrientationDetector({
      initialView: 'front',
      alpha: 0.45,
      requiredFrames: 3
    });
    const lateralLeft = getDevSampleLandmarks('lateral');
    let resLeft = detectorLeft.update(lateralLeft, 'auto');
    for (let i = 0; i < 12; i++) {
      resLeft = detectorLeft.update(lateralLeft, 'auto');
    }
    expect(resLeft.view).toBe('left');

    // Physical 180° turn in place from Left-side profile to Right-side profile:
    // flip x across 0.5 and swap anatomical left/right landmark pairs
    const lrPairs: [number, number][] = [
      [1, 4], [2, 5], [3, 6], [7, 8], [9, 10],
      [11, 12], [13, 14], [15, 16], [17, 18], [19, 20], [21, 22],
      [23, 24], [25, 26], [27, 28], [29, 30], [31, 32]
    ];
    const lateralRight = lateralLeft.map((lm) => ({ ...lm, x: 1 - lm.x }));
    for (const [a, b] of lrPairs) {
      const tmp = lateralRight[a];
      lateralRight[a] = lateralRight[b];
      lateralRight[b] = tmp;
    }
    const detectorRight = new OrientationDetector({
      initialView: 'front',
      alpha: 0.45,
      requiredFrames: 3
    });
    let resRight = detectorRight.update(lateralRight, 'auto');
    for (let i = 0; i < 12; i++) {
      resRight = detectorRight.update(lateralRight, 'auto');
    }
    expect(resRight.view).toBe('right');
  });

  it('tracks independent skull yaw while torso remains frontal', () => {
    const detector = new OrientationDetector({
      initialView: 'front',
      alpha: 0.5,
      requiredFrames: 3
    });
    const front = getDevSampleLandmarks('anterior');
    const turnedHead = front.map((lm) => ({ ...lm }));
    // Turn head toward right profile on screen (nose & face shifted toward left ear in screen X, right ear visible)
    const headCenterX = front[MP_LANDMARK.NOSE].x;
    turnedHead[MP_LANDMARK.NOSE].x = headCenterX + 0.045;
    turnedHead[MP_LANDMARK.MOUTH_LEFT].x = headCenterX + 0.036;
    turnedHead[MP_LANDMARK.MOUTH_RIGHT].x = headCenterX + 0.028;
    turnedHead[MP_LANDMARK.LEFT_EYE].x = headCenterX + 0.035;
    turnedHead[MP_LANDMARK.RIGHT_EYE].x = headCenterX + 0.02;
    turnedHead[MP_LANDMARK.RIGHT_EAR].x = headCenterX - 0.025;
    turnedHead[MP_LANDMARK.RIGHT_EAR].visibility = 0.92;
    turnedHead[MP_LANDMARK.LEFT_EAR].visibility = 0.15;

    let res = detector.update(turnedHead, 'auto');
    for (let i = 0; i < 8; i++) {
      res = detector.update(turnedHead, 'auto');
    }
    expect(res.view).toBe('front');
    expect(Math.abs(res.head.yawDeg)).toBeGreaterThan(25);
  });

  it('tracks real-time jaw opening from FaceTrackingResult and mouth landmarks', () => {
    const detector = new OrientationDetector({ initialView: 'front' });
    const front = getDevSampleLandmarks('anterior');

    let closed = detector.update(front, 'auto', { jawOpen: 0 });
    for (let i = 0; i < 5; i++) {
      closed = detector.update(front, 'auto', { jawOpen: 0 });
    }
    expect(closed.head.jawOpen).toBeLessThan(0.15);

    let opened = detector.update(front, 'auto', { jawOpen: 0.85 });
    for (let i = 0; i < 8; i++) {
      opened = detector.update(front, 'auto', { jawOpen: 0.85 });
    }
    expect(opened.head.jawOpen).toBeGreaterThan(0.6);

    // Also test pose mouth-drop fallback without explicit faceResult
    const poseOpened = front.map((lm) => ({ ...lm }));
    poseOpened[MP_LANDMARK.MOUTH_LEFT].y += 0.024;
    poseOpened[MP_LANDMARK.MOUTH_RIGHT].y += 0.024;
    const detectorPose = new OrientationDetector({ initialView: 'front' });
    let poseRes = detectorPose.update(poseOpened, 'auto');
    for (let i = 0; i < 8; i++) {
      poseRes = detectorPose.update(poseOpened, 'auto');
    }
    expect(poseRes.head.jawOpen).toBeGreaterThan(0.35);
  });
});
