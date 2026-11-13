import { describe, expect, it } from 'vitest';
import { ANATOMY_ARTWORK_REGISTRY } from '../../src/assets/anatomyRegistry';
import { ANATOMY_STRUCTURES } from '../../src/data/anatomyData';

describe('anatomyData single source of truth', () => {
  it('contains at least 100 muscles and at least 30 bones (136 total)', () => {
    const muscles = ANATOMY_STRUCTURES.filter((s) => s.type === 'muscle');
    const bones = ANATOMY_STRUCTURES.filter((s) => s.type === 'bone');

    expect(muscles.length).toBeGreaterThanOrEqual(100);
    expect(bones.length).toBeGreaterThanOrEqual(30);
    expect(ANATOMY_STRUCTURES.length).toBe(136);
  });

  it('has strictly unique IDs for every structure', () => {
    const ids = ANATOMY_STRUCTURES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has complete non-empty LA, DE, EN names and DE/EN descriptions', () => {
    for (const s of ANATOMY_STRUCTURES) {
      expect(s.names.la.trim().length, `${s.id} missing la name`).toBeGreaterThan(2);
      expect(s.names.de.trim().length, `${s.id} missing de name`).toBeGreaterThan(2);
      expect(s.names.en.trim().length, `${s.id} missing en name`).toBeGreaterThan(2);

      expect(s.descriptions.de.trim().length, `${s.id} missing de desc`).toBeGreaterThan(30);
      expect(s.descriptions.en.trim().length, `${s.id} missing en desc`).toBeGreaterThan(30);

      // Verify at least 2 sentences in both languages
      const deSentences = s.descriptions.de.split('.').filter((p) => p.trim().length > 0);
      const enSentences = s.descriptions.en.split('.').filter((p) => p.trim().length > 0);
      expect(deSentences.length, `${s.id} de desc needs >=2 sentences`).toBeGreaterThanOrEqual(2);
      expect(enSentences.length, `${s.id} en desc needs >=2 sentences`).toBeGreaterThanOrEqual(2);
    }
  });

  it('maps every artworkRef to a valid definition in ANATOMY_ARTWORK_REGISTRY', () => {
    for (const s of ANATOMY_STRUCTURES) {
      const def = ANATOMY_ARTWORK_REGISTRY.get(s.artworkRef);
      expect(def, `Missing artwork definition for ${s.artworkRef}`).toBeDefined();
      expect(def!.contours.length).toBeGreaterThan(0);
      for (const poly of def!.contours) {
        expect(poly.length).toBeGreaterThanOrEqual(3);
      }
      expect(def!.anchor.length).toBe(2);
      expect(s.layerOrder).toBeGreaterThanOrEqual(1);
      expect(s.layerOrder).toBeLessThanOrEqual(3);
    }
  });

  it('provides high-resolution osteology geometry and multi-layer sub-features for all 32 bones', () => {
    const bones = ANATOMY_STRUCTURES.filter((s) => s.type === 'bone');
    expect(bones.length).toBe(32);

    for (const b of bones) {
      const def = ANATOMY_ARTWORK_REGISTRY.get(b.artworkRef)!;
      const totalContourVertices = def.contours.reduce((sum, c) => sum + c.length, 0);
      expect(
        totalContourVertices,
        `${b.id} should have detailed osteological contour vertices (>= 7)`
      ).toBeGreaterThanOrEqual(7);

      for (const hole of def.cutouts ?? []) {
        expect(hole.length).toBeGreaterThanOrEqual(3);
      }
      for (const trab of def.trabecularZones ?? []) {
        expect(trab.length).toBeGreaterThanOrEqual(3);
      }
      for (const cart of def.cartilageZones ?? []) {
        expect(cart.length).toBeGreaterThanOrEqual(3);
      }
      for (const dp of def.detailPaths ?? []) {
        expect(dp.length).toBeGreaterThanOrEqual(2);
      }
    }

    // Verify key multi-layer osteology landmarks
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_cranium')!.cutouts!.length).toBeGreaterThanOrEqual(3);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_os_pubis')!.cutouts!.length).toBe(2);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_os_sacrum')!.cutouts!.length).toBe(8);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_vertebrae_thoracicae')!.contours.length).toBe(12);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_vertebrae_lumbales')!.contours.length).toBe(5);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_vertebrae_lumbales')!.cartilageZones!.length).toBeGreaterThanOrEqual(4);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_costae_verae')!.cartilageZones!.length).toBe(7);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_ossa_carpi')!.contours.length).toBe(8);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_phalanges_manus')!.contours.length).toBe(14);
    expect(ANATOMY_ARTWORK_REGISTRY.get('b_phalanges_pedis')!.contours.length).toBe(14);
  });
});
