import { describe, it, expect } from 'vitest';
import {
  FORMS_TABLE,
  ALL_FORMS,
  FAMILY_ORDER,
  getForm,
  getFormsForFamily,
  getFormByIndex,
  type CreatureFamily,
} from './forms.js';

describe('Phase 1 Foundation - Table A1 Forms as Pure Data', () => {
  it('contains exactly nine permanent forms across three families', () => {
    expect(ALL_FORMS.length).toBe(9);
    expect(Object.keys(FORMS_TABLE).length).toBe(9);

    const families: CreatureFamily[] = ['slime', 'wisp', 'stone'];
    for (const fam of families) {
      const forms = getFormsForFamily(fam);
      expect(forms.length).toBe(3);
      const indices = forms.map(f => f.indexInFamily).sort();
      expect(indices).toEqual([0, 1, 2]);
    }
  });

  it('matches physical constants from Master Plan §2 & §14', () => {
    // Slime
    const oobleck = getForm('oobleck');
    expect(oobleck.mass).toBe(1.2);
    expect(oobleck.restitution).toBe(0.85);
    expect(oobleck.relativeDensity).toBeGreaterThan(1.0); // Sinks when stopped, planes when fast
    expect(oobleck.jAbility.id).toBe('squeeze');

    const dewdrop = getForm('dewdrop');
    expect(dewdrop.jAbility.id).toBe('release_ballast');
    expect(dewdrop.kAbility.id).toBe('water_jet');

    const bubble = getForm('aether_bubble');
    expect(bubble.mass).toBe(0.4);
    expect(bubble.gravityMultiplier).toBe(0.35);
    expect(bubble.relativeDensity).toBeLessThan(1.0); // Floats naturally

    // Wisp
    const mist = getForm('mist');
    expect(mist.mass).toBe(0.3);
    expect(mist.gravityMultiplier).toBe(0.10);
    expect(mist.jAbility.id).toBe('phase');

    const zephyr = getForm('zephyr');
    expect(zephyr.kAbility.id).toBe('gust_dash');

    const lantern = getForm('lantern');
    expect(lantern.jAbility.id).toBe('condense');
    expect(lantern.kAbility.id).toBe('spectral_stairs');

    // Stone
    const aerolite = getForm('aerolite');
    expect(aerolite.relativeDensity).toBe(0.55); // Porous pumice floats (< 1.0)

    const geode = getForm('geode');
    expect(geode.mass).toBe(3.5);
    expect(geode.friction).toBe(0.05); // Ultra low rolling friction
    expect(geode.jAbility.id).toBe('roll_brake');
    expect(geode.kAbility.id).toBe('boost');

    const obsidian = getForm('obsidian');
    expect(obsidian.mass).toBe(9.0);
    expect(obsidian.friction).toBe(0.80);
    expect(obsidian.jAbility.id).toBe('anchor');
    expect(obsidian.kAbility.id).toBe('shockwave');
  });

  it('provides quick indexing by family and index (1, 2, 3 hotkeys)', () => {
    expect(getFormByIndex('slime', 0).id).toBe('oobleck');
    expect(getFormByIndex('slime', 1).id).toBe('dewdrop');
    expect(getFormByIndex('slime', 2).id).toBe('aether_bubble');

    expect(getFormByIndex('wisp', 0).id).toBe('mist');
    expect(getFormByIndex('wisp', 1).id).toBe('zephyr');
    expect(getFormByIndex('wisp', 2).id).toBe('lantern');

    expect(getFormByIndex('stone', 0).id).toBe('aerolite');
    expect(getFormByIndex('stone', 1).id).toBe('geode');
    expect(getFormByIndex('stone', 2).id).toBe('obsidian');
  });

  it('cycles families in correct order: slime -> wisp -> stone', () => {
    expect(FAMILY_ORDER).toEqual(['slime', 'wisp', 'stone']);
  });
});
