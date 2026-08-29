/**
 * Pool PostgreSQL e helper de query.
 */
import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { config } from './index';

// SSL habilitado via DB_SSL ou implicitamente quando ha DATABASE_URL (Neon/Render).
const sslEnabled = config.db.ssl || Boolean(config.db.url);
const sslOption = sslEnabled ? { rejectUnauthorized: false } : undefined;

const poolConfig: PoolConfig = config.db.url
  ? { connectionString: config.db.url, ssl: sslOption }
  : {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      password: config.db.password,
      ssl: sslOption,
    };

export const pool = new Pool(poolConfig);

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

/**
 * Executa uma funcao dentro de uma transacao.
 * Faz COMMIT em sucesso e ROLLBACK em erro, sempre liberando o client.
 * Usado para operacoes que exigem atomicidade + SELECT ... FOR UPDATE.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
