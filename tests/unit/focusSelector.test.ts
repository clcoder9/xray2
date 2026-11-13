import { describe, expect, it } from 'vitest';
import {
  findStructureAtPoint,
  selectFocusedStructure,
  type FocusCircle
} from '../../src/render/focusSelector';
import { getDevSampleLandmarks } from '../../src/vision/devFixtures';
import {
  buildSegmentRig,
  computeFrameViewport,
  projectStructuresToScreen
} from '../../src/vision/segmentRig';

describe('Focus selection, tap-to-pin, partial bodies & anatomical left/right', () => {
  const viewport = computeFrameViewport(720, 1080, 720, 1080, 'contain');

  it('selects the structure nearest the focus circle center', () => {
    const lms = getDevSampleLandmarks('anterior');
    const rig = buildSegmentRig(lms, viewport, false);
    const muscles = projectStructuresToScreen(rig, 'muscle', 'front');

    // Center focus circle over the chest / pectoralis region (~y=280)
    const chestCircle: FocusCircle = { cx: 310, cy: 295, radius: 110 };
    const chestRes = selectFocusedStructure(muscles, chestCircle, null);
    expect(chestRes.active).not.toBeNull();
    expect(chestRes.active!.structure.segment).toBe('torso');

    // Move focus circle down over the thigh (~y=640)
    const thighCircle: FocusCircle = { cx: 300, cy: 640, radius: 110 };
    const thighRes = selectFocusedStructure(muscles, thighCircle, null);
    expect(thighRes.active).not.toBeNull();
    expect(thighRes.active!.structure.segment).toBe('thigh');
  });

  it('supports explicit tap selection (Tap-to-Pin) and maintains pin until cleared', () => {
    const lms = getDevSampleLandmarks('anterior');
    const rig = buildSegmentRig(lms, viewport, false);
    const muscles = projectStructuresToScreen(rig, 'muscle', 'front');

    // Focus circle covering right upper arm
    const rightBicepsLong = muscles.find(
      (m) => m.instanceId === 'm_biceps_caput_longum:right'
    );
    expect(rightBicepsLong).toBeDefined();

    const circle: FocusCircle = {
      cx: rightBicepsLong!.anchor.x + 25,
      cy: rightBicepsLong!.anchor.y,
      radius: 130
    };

    const hit = findStructureAtPoint(
      muscles,
      circle,
      rightBicepsLong!.anchor.x,
      rightBicepsLong!.anchor.y
    );
    expect(hit).not.toBeNull();

    const pinnedRes = selectFocusedStructure(muscles, circle, hit!.instanceId);
    expect(pinnedRes.isPinned).toBe(true);
    expect(pinnedRes.active?.instanceId).toBe(hit!.instanceId);

    // Clearing pin reverts to unpinned nearest selection
    const unpinnedRes = selectFocusedStructure(muscles, circle, null);
    expect(unpinnedRes.isPinned).toBe(false);
  });

  it('preserves true anatomical left/right in both unmirrored and mirrored (front camera) display', () => {
    const lms = getDevSampleLandmarks('anterior');

    // Unmirrored front view: anatomical RIGHT shoulder is on viewer's LEFT (x < 360)
    const rigUnmirrored = buildSegmentRig(lms, viewport, false);
    const musclesUnmirrored = projectStructuresToScreen(rigUnmirrored, 'muscle', 'front');
    const rightPecUnmirrored = musclesUnmirrored.find(
      (m) => m.instanceId === 'm_pectoralis_major_sternocostalis:right'
    )!;
    const leftPecUnmirrored = musclesUnmirrored.find(
      (m) => m.instanceId === 'm_pectoralis_major_sternocostalis:left'
    )!;
    expect(rightPecUnmirrored.anchor.x).toBeLessThan(360);
    expect(leftPecUnmirrored.anchor.x).toBeGreaterThan(360);

    // Mirrored front selfie camera: viewer's LEFT is anatomical LEFT (x < 360)
    const rigMirrored = buildSegmentRig(lms, viewport, true);
    const musclesMirrored = projectStructuresToScreen(rigMirrored, 'muscle', 'front');
    const rightPecMirrored = musclesMirrored.find(
      (m) => m.instanceId === 'm_pectoralis_major_sternocostalis:right'
    )!;
    const leftPecMirrored = musclesMirrored.find(
      (m) => m.instanceId === 'm_pectoralis_major_sternocostalis:left'
    )!;
    expect(leftPecMirrored.anchor.x).toBeLessThan(360);
    expect(rightPecMirrored.anchor.x).toBeGreaterThan(360);
  });

  it('excludes unconfident lower-body segments when only partial upper body is visible', () => {
    const partialLms = getDevSampleLandmarks('upper_body');
    const rig = buildSegmentRig(partialLms, viewport, false);

    expect(rig.has('torso')).toBe(true);
    expect(rig.has('upper_arm:left')).toBe(true);
    expect(rig.has('thigh:left')).toBe(false);
    expect(rig.has('lower_leg:right')).toBe(false);
    expect(rig.has('foot:left')).toBe(false);
  });
});
