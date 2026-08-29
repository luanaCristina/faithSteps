/**
 * Implementacao concreta do ChallengeService (Challenges Engine).
 * Materializa desafios a partir de Reading Plans da YouVersion e expoe a
 * visao de progresso com metricas derivadas (percentual + estimativa).
 */
import {
  AppError,
  Challenge,
  ChallengeProgressView,
  ChallengeType,
  ERROR_CODES,
  Language,
} from '@/models';
import { challengeRepository } from '@/repositories/challenge.repository';
import { progressRepository } from '@/repositories/progress.repository';
import { YouVersionService } from '@/integrations/youversion';
import {
  estimateCompletionDate,
  percentComplete,
} from '@/modules/challenges-engine';
import { ChallengeService, CreateChallengeInput } from './challenge.service';

export class ChallengeServiceImpl implements ChallengeService {
  constructor(private readonly youversion: YouVersionService) {}

  createChallenge(input: CreateChallengeInput): Promise<Challenge> {
    return challengeRepository.create({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      challengeType: input.challengeType,
      totalChapters: input.totalChapters,
      youversionPlanId: input.youversionPlanId ?? null,
      collectiveGoalChapters: input.collectiveGoalChapters ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
    });
  }

  listActiveChallenges(type?: ChallengeType): Promise<Challenge[]> {
    return challengeRepository.listActive(type);
  }

  async createSeasonalFromPlan(planId: string, slug: string): Promise<Challenge> {
    const plan = await this.youversion.getReadingPlan(planId, Language.PT);
    // Total de capitulos = soma das referencias por dia do plano.
    const totalChapters = plan.days.reduce((sum, d) => sum + d.references.length, 0);
    return this.createChallenge({
      slug,
      title: plan.title,
      description: plan.description,
      challengeType: ChallengeType.SEASONAL,
      totalChapters: Math.max(totalChapters, 1),
      youversionPlanId: plan.id,
    });
  }

  async getProgressView(
    userId: string,
    challengeId: string,
  ): Promise<ChallengeProgressView> {
    const challenge = await challengeRepository.findById(challengeId);
    if (!challenge) {
      throw new AppError(ERROR_CODES.CHALLENGE_NOT_FOUND, 'Desafio nao encontrado.', 404);
    }

    const progress = await progressRepository.find(userId, challengeId);
    const chaptersRead = progress?.chaptersRead ?? 0;
    const startedAt = progress?.startedAt ?? new Date();

    return {
      challengeId,
      userId,
      chaptersRead,
      totalChapters: challenge.totalChapters,
      percentComplete: percentComplete(chaptersRead, challenge.totalChapters),
      status:
        progress?.status ??
        (chaptersRead >= challenge.totalChapters ? 'completed' : 'in_progress'),
      estimatedCompletionDate: estimateCompletionDate({
        chaptersRead,
        totalChapters: challenge.totalChapters,
        startedAt,
      }),
    } as ChallengeProgressView;
  }
}
