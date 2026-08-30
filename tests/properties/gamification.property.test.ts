import fc from 'fast-check';
import { Language, TALENTS_PER_BIBLE_DONATION } from '@/models';
import {
  biblesFromTalents,
  discipleshipTierForChapters,
  levelForXp,
  talentsForChapter,
  xpForChapter,
} from '@/modules/gamification';

describe('gamification (property-based)', () => {
  it('xpForChapter: PT = 15, EN = 25', () => {
    expect(xpForChapter(Language.PT)).toBe(15);
    expect(xpForChapter(Language.EN)).toBe(25);
    // EN sempre premia mais que PT
    expect(xpForChapter(Language.EN)).toBeGreaterThan(xpForChapter(Language.PT));
  });

  it('talentsForChapter: PT = 2, EN = 4 (documento V2)', () => {
    expect(talentsForChapter(Language.PT)).toBe(2);
    expect(talentsForChapter(Language.EN)).toBe(4);
    expect(talentsForChapter(Language.EN)).toBeGreaterThan(talentsForChapter(Language.PT));
  });

  it('discipleshipTierForChapters: nivel cresce (nao decresce) com mais capitulos', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1300 }), (n) => {
        const level = discipleshipTierForChapters(n).level;
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(5);
        expect(discipleshipTierForChapters(n + 1).level).toBeGreaterThanOrEqual(level);
      }),
    );
  });

  it('levelForXp: nunca abaixo de 1 e monotonicamente nao-decrescente', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 1_000_000 }), (xp) => {
        const level = levelForXp(xp);
        expect(level).toBeGreaterThanOrEqual(1);
        // XP maior nunca gera nivel menor
        expect(levelForXp(xp + 1)).toBeGreaterThanOrEqual(level);
      }),
    );
  });

  it('levelForXp: cada 100 XP sobe um nivel (para XP >= 0)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (xp) => {
        expect(levelForXp(xp)).toBe(Math.floor(xp / 100) + 1);
      }),
    );
  });

  it('biblesFromTalents: reconstroi o saldo original (bibles*custo + remaining)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (balance) => {
        const { bibles, remaining } = biblesFromTalents(balance);
        expect(bibles).toBeGreaterThanOrEqual(0);
        expect(remaining).toBeGreaterThanOrEqual(0);
        expect(remaining).toBeLessThan(TALENTS_PER_BIBLE_DONATION);
        expect(bibles * TALENTS_PER_BIBLE_DONATION + remaining).toBe(balance);
      }),
    );
  });

  it('biblesFromTalents: saldo negativo nao doa nada e nao gera residual negativo', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 0 }), (balance) => {
        const { bibles, remaining } = biblesFromTalents(balance);
        expect(bibles).toBe(0);
        expect(remaining).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
