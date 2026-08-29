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
  created_at: Date;
  updated_at: Date;
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
};
