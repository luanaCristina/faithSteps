/**
 * Challenges Engine - logica pura de progresso dos Desafios Biblicos.
 * Sem I/O. Calcula percentual, estimativa de conclusao (sem penalidades) e
 * progresso de metas coletivas dos Desafios de Servico.
 */
import { ProgressStatus } from '@/models';

/** Percentual lido (0..100), limitado e seguro contra divisao por zero. */
export function percentComplete(chaptersRead: number, totalChapters: number): number {
  if (totalChapters <= 0) return 0;
  const raw = (chaptersRead / totalChapters) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  return Math.round(clamped * 100) / 100;
}

/** Deriva o status a partir do progresso. */
export function deriveStatus(chaptersRead: number, totalChapters: number): ProgressStatus {
  return chaptersRead >= totalChapters && totalChapters > 0
    ? ProgressStatus.COMPLETED
    : ProgressStatus.IN_PROGRESS;
}

/**
 * Estimativa dinamica de conclusao, sem penalidades.
 * Projeta a data com base no ritmo medio observado (capitulos/dia).
 * Retorna null quando nao ha dados suficientes (ritmo zero ou ja concluido).
 */
export function estimateCompletionDate(params: {
  chaptersRead: number;
  totalChapters: number;
  startedAt: Date;
  now?: Date;
}): Date | null {
  const { chaptersRead, totalChapters, startedAt } = params;
  const now = params.now ?? new Date();

  if (chaptersRead >= totalChapters) return null;
  if (chaptersRead <= 0) return null;

  const elapsedMs = now.getTime() - startedAt.getTime();
  const elapsedDays = Math.max(elapsedMs / (1000 * 60 * 60 * 24), 1 / 24); // min ~1h
  const pace = chaptersRead / elapsedDays; // capitulos por dia
  if (pace <= 0) return null;

  const remaining = totalChapters - chaptersRead;
  const daysLeft = remaining / pace;
  return new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000);
}

/**
 * Progresso de uma meta coletiva (Desafio de Servico / Amar ao Proximo).
 * Soma os capitulos da comunidade contra a meta que destrava a doacao.
 */
export function collectiveGoalProgress(
  communityChaptersRead: number,
  goalChapters: number,
): { percent: number; unlocked: boolean } {
  const percent = percentComplete(communityChaptersRead, goalChapters);
  return { percent, unlocked: goalChapters > 0 && communityChaptersRead >= goalChapters };
}
