/**
 * Runner de migracoes: executa os arquivos .sql de /migrations em ordem.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './database';

async function runMigrations(): Promise<void> {
  const dir = join(__dirname, '..', '..', 'migrations');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), 'utf-8');
    // eslint-disable-next-line no-console
    console.log(`Aplicando migracao: ${file}`);
    await pool.query(sql);
  }

  // eslint-disable-next-line no-console
  console.log(`Concluido. ${files.length} migracao(oes) aplicada(s).`);
}

runMigrations()
  .then(() => pool.end())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Falha ao migrar:', err);
    pool.end().finally(() => process.exit(1));
  });
