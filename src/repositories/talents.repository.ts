/**
 * Repositorio de Talentos: saldo agregado (talents) + ledger (talent_transactions).
 */
import { PoolClient } from 'pg';
import { pool } from '@/config/database';
import { Talents, TalentTxKind } from '@/models';

type Queryable = Pick<PoolClient, 'query'> | typeof pool;

interface TalentsRow {
  id: string;
  user_id: string;
  balance: number;
  bibles_donated: number;
  updated_at: Date;
}

function toEntity(row: TalentsRow): Talents {
  return {
    id: row.id,
    userId: row.user_id,
    balance: row.balance,
    biblesDonated: row.bibles_donated,
    updatedAt: row.updated_at,
  };
}

export const talentsRepository = {
  /** Garante a linha de saldo do usuario e a bloqueia para atualizacao. */
  async getOrCreateForUpdate(db: Queryable, userId: string): Promise<Talents> {
    await db.query(
      `INSERT INTO talents (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    const res = await db.query<TalentsRow>(
      'SELECT * FROM talents WHERE user_id = $1 FOR UPDATE',
      [userId],
    );
    return toEntity(res.rows[0]);
  },

  /** Aplica novo saldo e total de Biblias doadas. */
  async setBalance(
    db: Queryable,
    userId: string,
    balance: number,
    biblesDonated: number,
  ): Promise<Talents> {
    const res = await db.query<TalentsRow>(
      `UPDATE talents
         SET balance = $2,
             bibles_donated = $3,
             updated_at = now()
       WHERE user_id = $1
       RETURNING *`,
      [userId, balance, biblesDonated],
    );
    return toEntity(res.rows[0]);
  },

  /** Registra uma movimentacao no ledger (append-only). */
  async recordTransaction(
    db: Queryable,
    params: {
      userId: string;
      kind: TalentTxKind;
      amount: number;
      sourceChallengeId?: string | null;
      note?: string | null;
    },
  ): Promise<void> {
    await db.query(
      `INSERT INTO talent_transactions
         (user_id, kind, amount, source_challenge_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        params.userId,
        params.kind,
        params.amount,
        params.sourceChallengeId ?? null,
        params.note ?? null,
      ],
    );
  },

  async findByUser(userId: string): Promise<Talents | null> {
    const res = await pool.query<TalentsRow>(
      'SELECT * FROM talents WHERE user_id = $1',
      [userId],
    );
    return res.rows[0] ? toEntity(res.rows[0]) : null;
  },

  /**
   * Debita `cost` Talentos do saldo e credita `bibles` doadas, registrando
   * a movimentacao DONATE. Deve rodar dentro de uma transacao (client bloqueado).
   */
  async debitForDonation(
    db: Queryable,
    userId: string,
    bibles: number,
    cost: number,
  ): Promise<Talents> {
    await this.recordTransaction(db, {
      userId,
      kind: TalentTxKind.DONATE,
      amount: bibles,
      note: `Doacao manual de ${bibles} Biblia(s)`,
    });
    const res = await db.query<TalentsRow>(
      `UPDATE talents
         SET balance = balance - $2,
             bibles_donated = bibles_donated + $3,
             updated_at = now()
       WHERE user_id = $1
       RETURNING *`,
      [userId, cost, bibles],
    );
    return toEntity(res.rows[0]);
  },
};
