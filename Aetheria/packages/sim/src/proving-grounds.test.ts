import { describe, it, expect } from 'vitest';
import { ALL_FORMS } from '@core/index.js';
import { ProvingGroundsCourse } from './proving-grounds.js';

describe('Phase 2 Form Matrix & Proving Grounds Exit Gate', () => {
  it('every form in Table A1 passes the complete Form Matrix', () => {
    const course = new ProvingGroundsCourse();
    const results = course.runFormMatrix();

    expect(Object.keys(results).length).toBe(9);

    for (const form of ALL_FORMS) {
      const res = results[form.id];
      expect(res).toBeDefined();

      // Master plan Phase 2 exit gate checks
      expect(
        res.signatureAbilityPassed,
        `Form ${form.id} failed signature ability check: ${res.notes}`
      ).toBe(true);

      expect(
        res.pressurePlatePassed,
        `Form ${form.id} failed pressure plate contact check: ${res.notes}`
      ).toBe(true);

      expect(
        res.waterRulePassed,
        `Form ${form.id} failed water rule check: ${res.notes}`
      ).toBe(true);
    }
  });
});
