/**
 * Ponto de entrada: carrega env, roda migrations (se configurado) e sobe o HTTP.
 */
import 'dotenv/config';
import { app } from './app';
import { config } from './config';
import { pool } from './config/database';
import { runMigrations } from './config/migrate';

async function bootstrap(): Promise<void> {
  if (config.runMigrationsOnBoot) {
    try {
      await runMigrations();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Falha ao aplicar migrations no boot:', err);
      await pool.end().catch(() => undefined);
      process.exit(1);
    }
  }

  // Bind em 0.0.0.0 para funcionar em plataformas de container (Render).
  app.listen(config.port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`FaithSteps ouvindo na porta ${config.port} (${config.nodeEnv}).`);
  });
}

void bootstrap();
