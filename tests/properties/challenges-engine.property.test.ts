import fc from 'fast-check';
import { ProgressStatus } from '@/models';
import {
  collectiveGoalProgress,
  deriveStatus,
  estimateCompletionDate,
  percentComplete,
} from '@/modules/challenges-engine';

describe('challenges-engine (property-based)', () => {
  it('percentComplete: sempre entre 0 e 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 0, max: 100_000 }),
        (read, total) => {
          const pct = percentComplete(read, total);
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);
        },
      ),
    );
  });

  it('percentComplete: total <= 0 retorna 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), fc.integer({ min: -1000, max: 0 }), (read, total) => {
        expect(percentComplete(read, total)).toBe(0);
      }),
    );
  });

  it('percentComplete: 100% quando leu tudo (total > 0)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), (total) => {
        expect(percentComplete(total, total)).toBe(100);
      }),
    );
  });

  it('deriveStatus: COMPLETED sse leu >= total (total > 0), senao IN_PROGRESS', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (read, total) => {
          const status = deriveStatus(read, total);
          if (read >= total) {
            expect(status).toBe(ProgressStatus.COMPLETED);
          } else {
            expect(status).toBe(ProgressStatus.IN_PROGRESS);
          }
        },
      ),
    );
  });

  it('estimateCompletionDate: null quando ja concluido ou sem leitura', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (total) => {
        // ja concluido
        expect(
          estimateCompletionDate({ chaptersRead: total, totalChapters: total, startedAt }),
        ).toBeNull();
        // sem leitura
        expect(
          estimateCompletionDate({ chaptersRead: 0, totalChapters: total, startedAt }),
        ).toBeNull();
      }),
    );
  });

  it('estimateCompletionDate: data futura (>= now) quando ha progresso parcial', () => {
    const startedAt = new Date('2026-01-01T00:00:00Z');
    const now = new Date('2026-01-11T00:00:00Z'); // 10 dias depois
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (total, readRaw) => {
          const chaptersRead = Math.min(readRaw, total - 1); // progresso parcial garantido
          if (chaptersRead <= 0) return;
          const eta = estimateCompletionDate({ chaptersRead, totalChapters: total, startedAt, now });
          expect(eta).not.toBeNull();
          expect((eta as Date).getTime()).toBeGreaterThanOrEqual(now.getTime());
        },
      ),
    );
  });

  it('collectiveGoalProgress: unlocked apenas quando comunidade atinge a meta', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000 }),
        fc.integer({ min: 1, max: 100_000 }),
        (community, goal) => {
          const { percent, unlocked } = collectiveGoalProgress(community, goal);
          expect(percent).toBeGreaterThanOrEqual(0);
          expect(percent).toBeLessThanOrEqual(100);
          expect(unlocked).toBe(community >= goal);
        },
      ),
    );
  });
});
