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

  it('scales head segment and facial muscles proportionally to head size and spans cranial width', () => {
    const fullLms = getDevSampleLandmarks('anterior');
    // Simulate stepping closer to the camera: scale pose 1.6x isotropically around torso/head center
    const closeLms = fullLms.map((pt) => ({
      ...pt,
      x: 0.5 + (pt.x - 0.5) * 1.6,
      y: 0.14 + (pt.y - 0.14) * 1.6
    }));

    const fullRig = buildSegmentRig(fullLms, viewport, false);
    const closeRig = buildSegmentRig(closeLms, viewport, false);

    const fullHead = fullRig.get('head');
    const closeHead = closeRig.get('head');
    expect(fullHead).toBeDefined();
    expect(closeHead).toBeDefined();

    // 1.6x scaled pose should yield ~1.6x larger head segment length & halfWidth
    expect(closeHead!.length / fullHead!.length).toBeCloseTo(1.6, 1);
    expect(closeHead!.halfWidth / fullHead!.halfWidth).toBeCloseTo(1.6, 1);

    const fullMuscles = projectStructuresToScreen(fullRig, 'muscle', 'front');
    const closeMuscles = projectStructuresToScreen(closeRig, 'muscle', 'front');

    const getWidthSpan = (
      instances: ReturnType<typeof projectStructuresToScreen>,
      idPrefix: string
    ) => {
      const matching = instances.filter(
        (inst) => inst.structure.segment === 'head' && inst.structure.id === idPrefix
      );
      expect(matching.length).toBeGreaterThan(0);
      const minX = Math.min(...matching.map((m) => m.bounds.minX));
      const maxX = Math.max(...matching.map((m) => m.bounds.maxX));
      return maxX - minX;
    };

    for (const muscleId of ['m_frontalis', 'm_temporalis', 'm_masseter', 'm_orbicularis_oculi']) {
      const fullSpan = getWidthSpan(fullMuscles, muscleId);
      const closeSpan = getWidthSpan(closeMuscles, muscleId);
      expect(closeSpan / fullSpan).toBeCloseTo(1.6, 1);
    }

    const headInstances = closeMuscles.filter((inst) => inst.structure.segment === 'head');
    const totalMuscleMinX = Math.min(...headInstances.map((m) => m.bounds.minX));
    const totalMuscleMaxX = Math.max(...headInstances.map((m) => m.bounds.maxX));
    const totalMuscleSpan = totalMuscleMaxX - totalMuscleMinX;
    const headFullWidth = closeHead!.halfWidth * 2;

    expect(totalMuscleSpan).toBeGreaterThanOrEqual(headFullWidth * 0.7);
  });

  it('stabilizes lateral torso/pelvis rig widths and culls far-side structures', () => {
    const lateral = getDevSampleLandmarks('lateral');
    const vp = computeFrameViewport(720, 1080, 1280, 720, 'contain');
    const rig = buildSegmentRig(lateral, vp, false, {
      view: 'left',
      rawScore: 0,
      smoothedScore: 0,
      bodyYawDeg: 88,
      head: {
        yawRad: Math.PI / 2,
        yawDeg: 90,
        pitchRatio: 0,
        view: 'left',
        facingSign: -1,
        jawOpen: 0
      }
    });

    const torso = rig.get('torso');
    const pelvis = rig.get('pelvis');
    expect(torso).toBeDefined();
    expect(pelvis).toBeDefined();
    expect(torso!.halfWidth).toBeGreaterThan(torso!.length * 0.18);
    expect(pelvis!.halfWidth).toBeGreaterThan(pelvis!.length * 0.45);
    const dot = torso!.axisU.x * torso!.axisV.x + torso!.axisU.y * torso!.axisV.y;
    expect(Math.abs(dot)).toBeLessThan(1e-3);

    const lateralMuscles = projectStructuresToScreen(rig, 'muscle', 'left');
    const rightSides = lateralMuscles.filter((m) => m.side === 'right');
    expect(rightSides.length).toBe(0);
    expect(lateralMuscles.some((m) => m.side === 'left')).toBe(true);
    expect(lateralMuscles.some((m) => m.side === 'midline')).toBe(true);
  });

  it('articulates mandible and mastication/oral muscles downward while keeping cranium/maxilla fixed', () => {
    const front = getDevSampleLandmarks('anterior');
    const vp = computeFrameViewport(720, 1080, 1280, 720, 'contain');

    const runCase = (view: 'front' | 'left', jawOpen: number) => {
      const rig = buildSegmentRig(front, vp, false, {
        view,
        rawScore: view === 'front' ? 1 : 0,
        smoothedScore: view === 'front' ? 1 : 0,
        bodyYawDeg: view === 'front' ? 0 : 90,
        head: {
          yawRad: view === 'front' ? 0 : Math.PI / 2,
          yawDeg: view === 'front' ? 0 : 90,
          pitchRatio: 0,
          view,
          facingSign: -1,
          jawOpen
        }
      });
      return {
        bones: projectStructuresToScreen(rig, 'bone', view),
        muscles: projectStructuresToScreen(rig, 'muscle', view)
      };
    };

    for (const view of ['front', 'left'] as const) {
      const closed = runCase(view, 0);
      const open = runCase(view, 0.85);

      const getBounds = (
        list: ReturnType<typeof projectStructuresToScreen>,
        id: string
      ) => {
        const hit = list.find((s) => s.structure.id === id);
        expect(hit).toBeDefined();
        return hit!.bounds;
      };

      const craniumClosed = getBounds(closed.bones, 'b_cranium');
      const craniumOpen = getBounds(open.bones, 'b_cranium');
      expect(Math.abs(craniumOpen.minY - craniumClosed.minY)).toBeLessThan(0.5);

      const maxillaClosed = getBounds(closed.bones, 'b_maxilla');
      const maxillaOpen = getBounds(open.bones, 'b_maxilla');
      expect(Math.abs(maxillaOpen.minY - maxillaClosed.minY)).toBeLessThan(0.5);

      const jawClosed = getBounds(closed.bones, 'b_mandibula');
      const jawOpenB = getBounds(open.bones, 'b_mandibula');
      expect(jawOpenB.maxY).toBeGreaterThan(jawClosed.maxY + 4);

      for (const muscleId of ['m_masseter', 'm_temporalis', 'm_orbicularis_oris']) {
        const mClosed = getBounds(closed.muscles, muscleId);
        const mOpen = getBounds(open.muscles, muscleId);
        expect(mOpen.maxY - mOpen.minY).toBeGreaterThan(mClosed.maxY - mClosed.minY + 1);
      }
    }
  });
});
