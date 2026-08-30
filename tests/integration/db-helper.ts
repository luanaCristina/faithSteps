/**
 * Helper para testes de integracao contra Postgres real.
 *
 * IMPORTANTE: este modulo define as variaveis DB_* ANTES de qualquer import
 * do pool da aplicacao. Os testes devem importar este helper primeiro.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client, Pool } from 'pg';

const TEST_DB = process.env.TEST_DB_NAME ?? 'faithsteps_test';
const TEST_USER = process.env.TEST_DB_USER ?? process.env.USER ?? 'postgres';
const TEST_HOST = process.env.TEST_DB_HOST ?? 'localhost';
const TEST_PORT = Number(process.env.TEST_DB_PORT ?? 5432);

// Injeta a config no ambiente para que src/config leia o banco de teste.
process.env.DB_HOST = TEST_HOST;
process.env.DB_PORT = String(TEST_PORT);
process.env.DB_NAME = TEST_DB;
process.env.DB_USER = TEST_USER;
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? '';

const MIGRATIONS_DIR = join(__dirname, '..', '..', 'migrations');

/** Verifica se ha um Postgres acessivel para o banco de teste. */
export async function isDatabaseAvailable(): Promise<boolean> {
  const client = new Client({
    host: TEST_HOST,
    port: TEST_PORT,
    database: TEST_DB,
    user: TEST_USER,
    password: process.env.DB_PASSWORD || undefined,
  });
  try {
    await client.connect();
    await client.query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

/** Aplica todas as migrations em ordem no banco de teste. */
export async function applyMigrations(pool: Pool): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await pool.query(sql);
  }
}

/** Limpa todas as tabelas de dominio (ordem segura por CASCADE). */
export async function truncateAll(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE talent_transactions, talents, chapter_completions, book_completions,
              badges, user_progress, challenges, users RESTART IDENTITY CASCADE`,
  );
}

/** Insere um usuario de teste e retorna seu id. */
export async function seedUser(
  pool: Pool,
  email = 'teste@faithsteps.dev',
): Promise<string> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO users (email, display_name, preferred_language)
     VALUES ($1, 'Usuario Teste', 'pt') RETURNING id`,
    [email],
  );
  return res.rows[0].id;
}

/** Insere um desafio de teste e retorna seu id. */
export async function seedChallenge(
  pool: Pool,
  totalChapters = 1189,
  slug = 'biblia-toda-test',
): Promise<string> {
  const res = await pool.query<{ id: string }>(
    `INSERT INTO challenges (slug, title, challenge_type, total_chapters)
     VALUES ($1, 'Biblia Toda (teste)', 'WHOLE_BIBLE', $2) RETURNING id`,
    [slug, totalChapters],
  );
  return res.rows[0].id;
}
