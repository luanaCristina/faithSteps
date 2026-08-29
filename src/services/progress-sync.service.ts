/**
 * Interface do motor de sincronizacao de progresso.
 * Quando o usuario marca um capitulo como concluido (na API YouVersion),
 * o FaithSteps credita XP (+15 PT / +25 EN) e acumula Talentos para doacao.
 *
 * A implementacao concreta orquestra repositorios dentro de uma transacao
 * (SELECT ... FOR UPDATE) e usa chapter_completions para idempotencia.
 */
import { CompleteChapterRequest, CompleteChapterResponse } from '@/models';

export interface ProgressSyncService {
  /**
   * Registra a conclusao de um capitulo de forma idempotente:
   * - credita XP conforme o idioma;
   * - incrementa capitulos lidos e Talentos;
   * - converte Talentos em Biblias doadas quando a meta e atingida.
   *
   * Se o capitulo ja foi concluido, lanca AppError(CHAPTER_ALREADY_COMPLETED).
   */
  completeChapter(input: CompleteChapterRequest): Promise<CompleteChapterResponse>;
}
