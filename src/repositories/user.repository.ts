/**
 * Repositorio de Usuarios: SQL cru + mapeamento snake_case -> camelCase.
 * Metodos aceitam um Queryable (pool ou client de transacao).
 */
import { PoolClient } from 'pg';
import { pool } from '@/config/database';
import { Language, User } from '@/models';

type Queryable = Pick<PoolClient, 'query'> | typeof pool;

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  preferred_language: Language;
  total_xp: number;
  level: number;
  youversion_user_id: string | null;
  reading_minutes: number;
  current_streak: number;
  last_read_date: Date | null;
  created_at: Date;
  updated_at: Date;
  password_hash: string | null;
}

function toEntity(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    preferredLanguage: row.preferred_language,
    totalXp: row.total_xp,
    level: row.level,
    youversionUserId: row.youversion_user_id,
    readingMinutes: row.reading_minutes ?? 0,
    currentStreak: row.current_streak ?? 0,
    lastReadDate: row.last_read_date ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepository = {
  /** Busca com bloqueio de linha (FOR UPDATE) para uso em transacoes. */
  async findByIdForUpdate(db: Queryable, id: string): Promise<User | null> {
    const res = await db.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 FOR UPDATE',
      [id],
    );
    return res.rows[0] ? toEntity(res.rows[0]) : null;
  },

  async findById(id: string): Promise<User | null> {
    const res = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] ? toEntity(res.rows[0]) : null;
  },

  async findByEmailForAuth(email: string): Promise<{ user: User; passwordHash: string | null } | null> {
    const res = await pool.query<UserRow>(
      'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email],
    );
    if (!res.rows[0]) return null;
    return { user: toEntity(res.rows[0]), passwordHash: res.rows[0].password_hash ?? null };
  },

  async createAccount(input: {
    email: string;
    displayName: string;
    preferredLanguage: Language;
    passwordHash: string;
  }): Promise<User> {
    const res = await pool.query<UserRow>(
      `INSERT INTO users (email, display_name, preferred_language, password_hash)
       VALUES (lower($1), $2, $3, $4)
       RETURNING *`,
      [input.email, input.displayName, input.preferredLanguage, input.passwordHash],
    );
    return toEntity(res.rows[0]);
  },

  /** Aplica ganho de XP e recalcula o nivel. Retorna o novo total. */
  async addXpAndLevel(
    db: Queryable,
    userId: string,
    xpDelta: number,
    newLevel: number,
  ): Promise<number> {
    const res = await db.query<{ total_xp: number }>(
      `UPDATE users
         SET total_xp = total_xp + $2,
             level = $3,
             updated_at = now()
       WHERE id = $1
       RETURNING total_xp`,
      [userId, xpDelta, newLevel],
    );
    return res.rows[0]?.total_xp ?? 0;
  },

  /**
   * Atualiza a ofensiva (Grace Streak) com base no dia de hoje.
   * Sem punicao: se pulou dias, apenas reinicia em 1; nunca zera por "falha".
   */
  async touchStreak(db: Queryable, userId: string, today: Date): Promise<number> {
    const iso = today.toISOString().slice(0, 10);
    const res = await db.query<{ current_streak: number }>(
      `UPDATE users
         SET current_streak = CASE
               WHEN last_read_date = $2::date THEN current_streak
               WHEN last_read_date = ($2::date - INTERVAL '1 day') THEN current_streak + 1
               ELSE 1
             END,
             last_read_date = $2::date,
             updated_at = now()
       WHERE id = $1
       RETURNING current_streak`,
      [userId, iso],
    );
    return res.rows[0]?.current_streak ?? 1;
  },

  /** Concede uma insignia (idempotente). */
  async awardBadge(
    db: Queryable,
    userId: string,
    code: string,
    label: string,
  ): Promise<boolean> {
    const res = await db.query(
      `INSERT INTO badges (user_id, code, label)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, code) DO NOTHING`,
      [userId, code, label],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async listBadges(userId: string): Promise<{ code: string; label: string; earnedAt: Date }[]> {
    const res = await pool.query<{ code: string; label: string; earned_at: Date }>(
      'SELECT code, label, earned_at FROM badges WHERE user_id = $1 ORDER BY earned_at',
      [userId],
    );
    return res.rows.map((r) => ({ code: r.code, label: r.label, earnedAt: r.earned_at }));
  },

  /** Cria um usuario (usado no seed / onboarding). */
  async create(input: {
    email: string;
    displayName: string;
    preferredLanguage: Language;
  }): Promise<User> {
    const res = await pool.query<UserRow>(
      `INSERT INTO users (email, display_name, preferred_language)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING *`,
      [input.email, input.displayName, input.preferredLanguage],
    );
    return toEntity(res.rows[0]);
  },
};
