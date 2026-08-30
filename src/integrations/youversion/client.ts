/**
 * Instancia unica do cliente YouVersion, escolhida pela config
 * (mock em staging, HTTP em producao). Modulo dedicado para evitar
 * dependencias circulares entre as rotas.
 */
import { config } from '@/config';
import { HttpYouVersionService } from './youversion.http';
import { MockYouVersionService } from './youversion.mock';
import { YouVersionService } from './youversion.service';

export const youversion: YouVersionService = config.youversion.useMock
  ? new MockYouVersionService()
  : new HttpYouVersionService({
      baseUrl: config.youversion.baseUrl,
      apiKey: config.youversion.apiKey,
      versionId: config.youversion.versionId,
    });
