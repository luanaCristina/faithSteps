/**
 * Implementacao concreta do motor de sincronizacao de progresso.
 *
 * Fluxo atomico (uma transacao, com bloqueios FOR UPDATE):
 *  1. valida usuario e desafio;
 *  2. registra o capitulo de forma idempotente (chapter_completions);
 *  3. credita XP conforme idioma e recalcula nivel;
 *  4. incrementa capitulos lidos e atualiza status;
 *  5. acumula Talentos e converte em Biblias doadas quando a meta e atingida.
 */
import {
  AppError,
  CompleteChapterRequest,
  CompleteChapterResponse,
  ERROR_CODES,
  TalentTxKind,
} from '@/models';
import { withTransaction } from '@/config/database';
import { challengeRepository } from '@/repositories/challenge.repository';
import { userRepository } from '@/repositories/user.repository';
import { progressRepository } from '@/repositories/progress.repository';
import { talentsRepository } from '@/repositories/talents.repository';
import {
  biblesFromTalents,
  levelForXp,
  talentsForChapter,
  xpForChapter,
} from '@/modules/gamification';
import { deriveStatus, percentComplete } from '@/modules/challenges-engine';
import { ProgressSyncService } from './progress-sync.service';

export class ProgressSyncServiceImpl implements ProgressSyncService {
  async completeChapter(
    input: CompleteChapterRequest,
  ): Promise<CompleteChapterResponse> {
    const challenge = await challengeRepository.findById(input.challengeId);
    if (!challenge) {
      throw new AppError(ERROR_CODES.CHALLENGE_NOT_FOUND, 'Desafio nao encontrado.', 404);
    }
    if (!challenge.isActive) {
      throw new AppError(ERROR_CODES.CHALLENGE_INACTIVE, 'Desafio inativo.', 409);
    }

    return withTransaction(async (db) => {
      // Bloqueia o usuario para atualizacao consistente de XP.
      const user = await userRepository.findByIdForUpdate(db, input.userId);
      if (!user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'Usuario nao encontrado.', 404);
      }

      const xp = xpForChapter(input.language);

      // Idempotencia: se ja concluido, nao credita novamente.
      const isNew = await progressRepository.recordChapterCompletion(db, {
        userId: input.userId,
        challengeId: input.challengeId,
        bookUsfm: input.bookUsfm,
        chapter: input.chapter,
        language: input.language,
        xpAwarded: xp,
      });
      if (!isNew) {
        throw new AppError(
          ERROR_CODES.CHAPTER_ALREADY_COMPLETED,
          'Capitulo ja registrado para este desafio.',
          409,
        );
      }

      // Bloqueia e atualiza o progresso do desafio.
      const progress = await progressRepository.getOrCreateForUpdate(
        db,
        input.userId,
        input.challengeId,
      );
      const newChaptersRead = progress.chaptersRead + 1;
      const status = deriveStatus(newChaptersRead, challenge.totalChapters);
      const updated = await progressRepository.applyIncrement(db, {
        userId: input.userId,
        challengeId: input.challengeId,
        chaptersDelta: 1,
        xpDelta: xp,
        status,
        completedAt: status === 'completed' ? new Date() : progress.completedAt,
      });

      // Credita XP no usuario e recalcula nivel.
      const newTotalXp = user.totalXp + xp;
      await userRepository.addXpAndLevel(db, input.userId, xp, levelForXp(newTotalXp));

      // Acumula Talentos e converte saldo em Biblias doadas.
      const talents = await talentsRepository.getOrCreateForUpdate(db, input.userId);
      const earned = talentsForChapter();
      await talentsRepository.recordTransaction(db, {
        userId: input.userId,
        kind: TalentTxKind.EARN,
        amount: earned,
        sourceChallengeId: input.challengeId,
        note: `${input.bookUsfm}.${input.chapter} (${input.language})`,
      });

      const accumulated = talents.balance + earned;
      const { bibles, remaining } = biblesFromTalents(accumulated);
      let biblesDonated = talents.biblesDonated;
      if (bibles > 0) {
        biblesDonated += bibles;
        await talentsRepository.recordTransaction(db, {
          userId: input.userId,
          kind: TalentTxKind.DONATE,
          amount: bibles,
          sourceChallengeId: input.challengeId,
          note: `Conversao de ${bibles} Biblia(s) doada(s)`,
        });
      }
      const savedTalents = await talentsRepository.setBalance(
        db,
        input.userId,
        remaining,
        biblesDonated,
      );

      return {
        chaptersRead: updated.chaptersRead,
        totalChapters: challenge.totalChapters,
        percentComplete: percentComplete(updated.chaptersRead, challenge.totalChapters),
        xpAwarded: xp,
        totalXp: newTotalXp,
        talentsBalance: savedTalents.balance,
        biblesDonated: savedTalents.biblesDonated,
      };
    });
  }
}

export const progressSyncService = new ProgressSyncServiceImpl();
