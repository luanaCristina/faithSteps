/**
 * Interface de servico dos Desafios Biblicos (Challenges Engine).
 * A implementacao concreta usa repositorios + a YouVersionService para
 * materializar desafios a partir de Reading Plans.
 */
import { Challenge, ChallengeProgressView, ChallengeType } from '@/models';

export interface CreateChallengeInput {
  slug: string;
  title: string;
  description?: string;
  challengeType: ChallengeType;
  totalChapters: number;
  youversionPlanId?: string;
  collectiveGoalChapters?: number;
  startsAt?: Date;
  endsAt?: Date;
}

export interface ChallengeService {
  /** Cria um desafio (Biblia Toda, Sazonal ou de Servico). */
  createChallenge(input: CreateChallengeInput): Promise<Challenge>;

  /** Lista desafios ativos, opcionalmente filtrando por tipo. */
  listActiveChallenges(type?: ChallengeType): Promise<Challenge[]>;

  /**
   * Cria um Desafio Sazonal a partir de um Reading Plan da YouVersion,
   * derivando total de capitulos e metadados do plano.
   */
  createSeasonalFromPlan(planId: string, slug: string): Promise<Challenge>;

  /** Retorna a visao de progresso do usuario com metricas derivadas. */
  getProgressView(userId: string, challengeId: string): Promise<ChallengeProgressView>;
}
