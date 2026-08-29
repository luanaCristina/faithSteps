/**
 * Ponto de entrada: carrega env, sobe o servidor HTTP.
 */
import 'dotenv/config';
import { app } from './app';
import { config } from './config';

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`FaithSteps ouvindo na porta ${config.port} (${config.nodeEnv}).`);
});
