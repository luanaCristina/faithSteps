/** Persistência de sessões autenticadas; o token em texto nunca vai para o banco. */
import { pool } from '@/config/database';

export const authSessionRepository = {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  },

  async findUserIdByTokenHash(tokenHash: string): Promise<string | null> {
    const res = await pool.query<{ user_id: string }>(
      `SELECT user_id
         FROM auth_sessions
        WHERE token_hash = $1 AND expires_at > now()
        LIMIT 1`,
      [tokenHash],
    );
    if (!res.rows[0]) return null;

    await pool.query(
      'UPDATE auth_sessions SET last_used_at = now() WHERE token_hash = $1',
      [tokenHash],
    );
    return res.rows[0].user_id;
  },

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await pool.query('DELETE FROM auth_sessions WHERE token_hash = $1', [tokenHash]);
  },
};
