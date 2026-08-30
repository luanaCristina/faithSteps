import { Challenge, ChallengeType, TOTAL_BIBLE_CHAPTERS } from '@/models';
import { challengeRepository } from '@/repositories/challenge.repository';

export async function ensureWholeBibleChallenge(): Promise<Challenge> {
  const [existing] = await challengeRepository.listActive(ChallengeType.WHOLE_BIBLE);
  if (existing) return existing;

  return challengeRepository.create({
    slug: 'biblia-toda',
    title: 'Desafio da Biblia Toda',
    description: 'Leia os 66 livros (1.189 capitulos) no seu ritmo amoroso.',
    challengeType: ChallengeType.WHOLE_BIBLE,
    totalChapters: TOTAL_BIBLE_CHAPTERS,
    youversionPlanId: null,
    collectiveGoalChapters: null,
    startsAt: null,
    endsAt: null,
  });
}
