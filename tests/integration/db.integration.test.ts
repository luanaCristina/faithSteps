/**
 * Testes de integracao contra Postgres REAL.
 *
 * Requer um Postgres acessivel no banco de teste (default: faithsteps_test).
 * Se o banco nao estiver disponivel, a suite inteira e pulada (describe.skip),
 * para nao quebrar ambientes de CI sem Postgres.
 *
 * Execucao: npm run test:db
 */

// 1) Helper primeiro: define DB_* antes de qualquer import do pool da app.
import {
  applyMigrations,
  isDatabaseAvailable,
  seedChallenge,
  seedUser,
  truncateAll,
} from './db-helper';

// Jest decide describe/skip de forma sincrona, entao usamos um flag resolvido
// no beforeAll e pulamos os testes individualmente se o banco estiver indisponivel.
let available = false;

// 3) Imports do dominio (o pool ja aponta para o banco de teste).
import { Language } from '@/models';
import { pool } from '@/config/database';
import { progressSyncService } from '@/services/progress-sync.impl';

jest.setTimeout(30000);

beforeAll(async () => {
  available = await isDatabaseAvailable();
  if (!available) {
    // eslint-disable-next-line no-console
    console.warn(
      '[db.integration] Postgres indisponivel - testes de banco real serao pulados.',
    );
    return;
  }
  await applyMigrations(pool);
});

afterAll(async () => {
  await pool.end().catch(() => undefined);
});

beforeEach(async () => {
  if (!available) return;
  await truncateAll(pool);
});

const maybe = (name: string, fn: () => Promise<void>) =>
  it(name, async () => {
    if (!available) return; // pula silenciosamente
    await fn();
  });

describe('Integracao Postgres real - ProgressSyncService', () => {
  maybe('completeChapter credita XP e persiste progresso/talentos', async () => {
    const userId = await seedUser(pool);
    const challengeId = await seedChallenge(pool);

    const res = await progressSyncService.completeChapter({
      userId,
      challengeId,
      bookUsfm: 'JHN',
      chapter: 3,
      language: Language.EN,
    });

    expect(res.xpAwarded).toBe(25);
    expect(res.chaptersRead).toBe(1);
    expect(res.totalXp).toBe(25);

    // Verifica persistencia real
    const user = await pool.query('SELECT total_xp FROM users WHERE id = $1', [userId]);
    expect(user.rows[0].total_xp).toBe(25);

    const prog = await pool.query(
      'SELECT chapters_read FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
      [userId, challengeId],
    );
    expect(prog.rows[0].chapters_read).toBe(1);

    const tx = await pool.query(
      "SELECT count(*)::int AS n FROM talent_transactions WHERE user_id = $1 AND kind = 'EARN'",
      [userId],
    );
    expect(tx.rows[0].n).toBe(1);
  });

  maybe('idempotencia: mesmo capitulo duas vezes -> 409 e nao duplica XP', async () => {
    const userId = await seedUser(pool);
    const challengeId = await seedChallenge(pool);
    const input = {
      userId,
      challengeId,
      bookUsfm: 'GEN',
      chapter: 1,
      language: Language.PT,
    };

    await progressSyncService.completeChapter(input);
    await expect(progressSyncService.completeChapter(input)).rejects.toMatchObject({
      code: 'CHAPTER_ALREADY_COMPLETED',
    });

    const user = await pool.query('SELECT total_xp FROM users WHERE id = $1', [userId]);
    expect(user.rows[0].total_xp).toBe(15); // creditado apenas uma vez
  });

  maybe(
    'concorrencia (FOR UPDATE): dois capitulos simultaneos somam corretamente',
    async () => {
      const userId = await seedUser(pool);
      const challengeId = await seedChallenge(pool);

      // Dois capitulos DIFERENTES concluidos em paralelo.
      const [a, b] = await Promise.all([
        progressSyncService.completeChapter({
          userId,
          challengeId,
          bookUsfm: 'JHN',
          chapter: 1,
          language: Language.PT,
        }),
        progressSyncService.completeChapter({
          userId,
          challengeId,
          bookUsfm: 'JHN',
          chapter: 2,
          language: Language.PT,
        }),
      ]);

      expect([a.chaptersRead, b.chaptersRead].sort()).toEqual([1, 2]);

      // Estado final consistente: 2 capitulos, 30 XP (15 + 15).
      const prog = await pool.query(
        'SELECT chapters_read, xp_earned FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
        [userId, challengeId],
      );
      expect(prog.rows[0].chapters_read).toBe(2);
      expect(prog.rows[0].xp_earned).toBe(30);

      const user = await pool.query('SELECT total_xp FROM users WHERE id = $1', [userId]);
      expect(user.rows[0].total_xp).toBe(30);
    },
  );

  maybe(
    'concorrencia agressiva: N requisicoes ao MESMO capitulo -> 1 sucesso, resto 409',
    async () => {
      const userId = await seedUser(pool);
      const challengeId = await seedChallenge(pool);
      const input = {
        userId,
        challengeId,
        bookUsfm: 'ROM',
        chapter: 8,
        language: Language.EN,
      };

      const N = 8;
      // Dispara N conclusoes simultaneas do mesmo capitulo.
      const results = await Promise.allSettled(
        Array.from({ length: N }, () => progressSyncService.completeChapter(input)),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled');
      const conflicts = results.filter(
        (r) =>
          r.status === 'rejected' &&
          (r.reason as { code?: string }).code === 'CHAPTER_ALREADY_COMPLETED',
      );

      // Exatamente uma conclusao vence; as demais colidem na UNIQUE.
      expect(succeeded).toHaveLength(1);
      expect(conflicts).toHaveLength(N - 1);

      // Estado final: 1 capitulo, XP creditado uma unica vez.
      const prog = await pool.query(
        'SELECT chapters_read, xp_earned FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
        [userId, challengeId],
      );
      expect(prog.rows[0].chapters_read).toBe(1);
      expect(prog.rows[0].xp_earned).toBe(25);

      const user = await pool.query('SELECT total_xp FROM users WHERE id = $1', [userId]);
      expect(user.rows[0].total_xp).toBe(25);

      // Apenas um registro de conclusao e uma transacao EARN.
      const completions = await pool.query(
        'SELECT count(*)::int AS n FROM chapter_completions WHERE user_id = $1',
        [userId],
      );
      expect(completions.rows[0].n).toBe(1);

      const earns = await pool.query(
        "SELECT count(*)::int AS n FROM talent_transactions WHERE user_id = $1 AND kind = 'EARN'",
        [userId],
      );
      expect(earns.rows[0].n).toBe(1);
    },
  );

  maybe('doacao: ao fechar a meta, converte Talentos em 1 Biblia', async () => {
    const userId = await seedUser(pool);
    // Desafio pequeno para fechar a meta rapidamente NAO aplica (a meta de
    // doacao e global = 1189). Em vez disso, semeamos saldo perto do limite.
    const challengeId = await seedChallenge(pool, 1189);

    // Semeia saldo de Talentos = 1188 (falta 1 para uma Biblia).
    await pool.query(
      `INSERT INTO talents (user_id, balance, bibles_donated) VALUES ($1, 1188, 0)`,
      [userId],
    );

    const res = await progressSyncService.completeChapter({
      userId,
      challengeId,
      bookUsfm: 'PSA',
      chapter: 119,
      language: Language.PT,
    });

    expect(res.biblesDonated).toBe(1);
    expect(res.talentsBalance).toBe(0);

    const donate = await pool.query(
      "SELECT count(*)::int AS n FROM talent_transactions WHERE user_id = $1 AND kind = 'DONATE'",
      [userId],
    );
    expect(donate.rows[0].n).toBe(1);
  });
});
