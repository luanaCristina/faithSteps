/**
 * Runner de migracoes: executa os arquivos .sql de /migrations em ordem.
 * Pode ser chamado via CLI (npm run migrate) ou no boot da aplicacao.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './database';

/** Aplica todas as migrations .sql em ordem no pool da aplicacao. */
export async function runMigrations(): Promise<void> {
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

// Execucao direta via CLI: `ts-node src/config/migrate.ts` ou `node dist/...`.
if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Falha ao migrar:', err);
      pool.end().finally(() => process.exit(1));
    });
}
