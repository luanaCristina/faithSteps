/**
 * Bootstrap de producao: registra os aliases de path (@/*) apontando para a
 * pasta compilada (dist) ANTES de carregar a aplicacao, e entao inicia o server.
 *
 * Necessario porque o TypeScript nao reescreve os aliases no output JS;
 * em runtime, o Node precisa saber que "@/..." resolve para "dist/...".
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { register } = require('tsconfig-paths');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require('path');

register({
  baseUrl: join(__dirname), // .../dist
  paths: {
    '@/*': ['*'],
  },
});

// Carrega o servidor ja com os aliases resolvidos.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./server');
