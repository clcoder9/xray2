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
});
