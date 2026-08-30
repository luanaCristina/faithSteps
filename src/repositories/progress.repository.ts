/**
 * Repositorio de progresso: user_progress + chapter_completions.
 * A idempotencia de capitulos apoia-se na UNIQUE de chapter_completions.
 */
import { PoolClient } from 'pg';
import { pool } from '@/config/database';
import { Language, ProgressStatus, UserProgress } from '@/models';

type Queryable = Pick<PoolClient, 'query'> | typeof pool;

interface ProgressRow {
  id: string;
  user_id: string;
  challenge_id: string;
  chapters_read: number;
  xp_earned: number;
  status: ProgressStatus;
  started_at: Date;
  completed_at: Date | null;
  last_book_usfm: string | null;
  last_chapter: number | null;
  last_opened_at: Date | null;
  updated_at: Date;
}

function toEntity(row: ProgressRow): UserProgress {
  return {
    id: row.id,
    userId: row.user_id,
    challengeId: row.challenge_id,
    chaptersRead: row.chapters_read,
    xpEarned: row.xp_earned,
    status: row.status,
    startedAt: row.started_at,
      completedAt: row.completed_at,
      lastBookUsfm: row.last_book_usfm ?? null,
      lastChapter: row.last_chapter ?? null,
      lastOpenedAt: row.last_opened_at ?? null,
      updatedAt: row.updated_at,
  };
}

export const progressRepository = {
  /**
   * Garante um registro de progresso (cria se nao existir) e o bloqueia
   * (FOR UPDATE) para atualizacao atomica. Usa upsert idempotente.
   */
  async getOrCreateForUpdate(
    db: Queryable,
    userId: string,
    challengeId: string,
  ): Promise<UserProgress> {
    await db.query(
      `INSERT INTO user_progress (user_id, challenge_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, challenge_id) DO NOTHING`,
      [userId, challengeId],
    );
    const res = await db.query<ProgressRow>(
      `SELECT * FROM user_progress
        WHERE user_id = $1 AND challenge_id = $2
        FOR UPDATE`,
      [userId, challengeId],
    );
    return toEntity(res.rows[0]);
  },

  /**
   * Registra a conclusao de um capitulo. Retorna false se o capitulo ja
   * havia sido concluido (violacao da UNIQUE tratada via ON CONFLICT).
   */
  async recordChapterCompletion(
    db: Queryable,
    params: {
      userId: string;
      challengeId: string;
      bookUsfm: string;
      chapter: number;
      language: Language;
      xpAwarded: number;
    },
  ): Promise<boolean> {
    const res = await db.query(
      `INSERT INTO chapter_completions
         (user_id, challenge_id, book_usfm, chapter, language, xp_awarded)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, challenge_id, book_usfm, chapter, language)
       DO NOTHING`,
      [
        params.userId,
        params.challengeId,
        params.bookUsfm,
        params.chapter,
        params.language,
        params.xpAwarded,
      ],
    );
    return (res.rowCount ?? 0) > 0;
  },

  /** Atualiza contadores do progresso e status. */
  async applyIncrement(
    db: Queryable,
    params: {
      userId: string;
      challengeId: string;
      chaptersDelta: number;
      xpDelta: number;
      status: ProgressStatus;
      completedAt: Date | null;
    },
  ): Promise<UserProgress> {
    const res = await db.query<ProgressRow>(
      `UPDATE user_progress
         SET chapters_read = chapters_read + $3,
             xp_earned = xp_earned + $4,
             status = $5,
             completed_at = $6,
             updated_at = now()
       WHERE user_id = $1 AND challenge_id = $2
       RETURNING *`,
      [
        params.userId,
        params.challengeId,
        params.chaptersDelta,
        params.xpDelta,
        params.status,
        params.completedAt,
      ],
    );
    return toEntity(res.rows[0]);
  },

  async find(userId: string, challengeId: string): Promise<UserProgress | null> {
    const res = await pool.query<ProgressRow>(
      'SELECT * FROM user_progress WHERE user_id = $1 AND challenge_id = $2',
      [userId, challengeId],
    );
    return res.rows[0] ? toEntity(res.rows[0]) : null;
  },

  /** Registra a última posição aberta para permitir retomar a jornada. */
  async saveLastPosition(
    userId: string,
    challengeId: string,
    bookUsfm: string,
    chapter: number,
  ): Promise<UserProgress> {
    await pool.query(
      `INSERT INTO user_progress
         (user_id, challenge_id, last_book_usfm, last_chapter, last_opened_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (user_id, challenge_id) DO UPDATE SET
         last_book_usfm = EXCLUDED.last_book_usfm,
         last_chapter = EXCLUDED.last_chapter,
         last_opened_at = now(),
         updated_at = now()`,
      [userId, challengeId, bookUsfm, chapter],
    );
    const progress = await this.find(userId, challengeId);
    if (!progress) throw new Error('Falha ao salvar a posição de leitura.');
    return progress;
  },

  /** Conta capitulos distintos concluidos de um livro (para detectar livro completo). */
  async countBookChapters(
    db: Queryable,
    userId: string,
    challengeId: string,
    bookUsfm: string,
  ): Promise<number> {
    const res = await db.query<{ n: string }>(
      `SELECT COUNT(DISTINCT chapter)::int AS n
         FROM chapter_completions
        WHERE user_id = $1 AND challenge_id = $2 AND book_usfm = $3`,
      [userId, challengeId, bookUsfm],
    );
    return Number(res.rows[0]?.n ?? 0);
  },

  /**
   * Registra a conclusao de um livro (idempotente). Retorna true se e a
   * primeira vez (deve creditar o bonus), false se ja registrado.
   */
  async recordBookCompletion(
    db: Queryable,
    params: {
      userId: string;
      challengeId: string;
      bookUsfm: string;
      xpAwarded: number;
      talentsAwarded: number;
    },
  ): Promise<boolean> {
    const res = await db.query(
      `INSERT INTO book_completions
         (user_id, challenge_id, book_usfm, xp_awarded, talents_awarded)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, challenge_id, book_usfm) DO NOTHING`,
      [params.userId, params.challengeId, params.bookUsfm, params.xpAwarded, params.talentsAwarded],
    );
    return (res.rowCount ?? 0) > 0;
  },

  /** Progresso por livro do usuario no desafio (para o dashboard). */
  async bookProgress(
    userId: string,
    challengeId: string,
  ): Promise<{ bookUsfm: string; chaptersRead: number }[]> {
    const res = await pool.query<{ book_usfm: string; n: string }>(
      `SELECT book_usfm, COUNT(DISTINCT chapter)::int AS n
         FROM chapter_completions
        WHERE user_id = $1 AND challenge_id = $2
        GROUP BY book_usfm`,
      [userId, challengeId],
    );
    return res.rows.map((r) => ({ bookUsfm: r.book_usfm, chaptersRead: Number(r.n) }));
  },
};
