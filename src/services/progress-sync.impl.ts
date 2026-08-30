/**
 * Motor de sincronizacao de progresso (documento V2).
 *
 * Fluxo atomico (uma transacao, com bloqueios FOR UPDATE):
 *  1. valida usuario e desafio;
 *  2. registra o capitulo de forma idempotente (chapter_completions);
 *  3. credita XP (por idioma + bonus de quiz) e recalcula nivel;
 *  4. incrementa capitulos lidos, atualiza status e ofensiva (streak);
 *  5. detecta conclusao de livro (bonus +150 XP / +20 Talentos + insignia);
 *  6. acumula Talentos e converte em Biblias doadas quando a meta e atingida;
 *  7. concede insignias de marco (Primeiros Passos, Palavra Cumprida).
 */
import {
  AppError,
  CompleteChapterRequest,
  CompleteChapterResponse,
  DISCIPLESHIP_TIERS,
  ERROR_CODES,
  QUIZ_TALENTS_BONUS,
  QUIZ_XP_BONUS,
  TalentTxKind,
  WHOLE_BIBLE_XP_BONUS,
} from '@/models';
import { withTransaction } from '@/config/database';
import { challengeRepository } from '@/repositories/challenge.repository';
import { userRepository } from '@/repositories/user.repository';
import { progressRepository } from '@/repositories/progress.repository';
import { talentsRepository } from '@/repositories/talents.repository';
import {
  biblesFromTalents,
  bookCompletionTalents,
  bookCompletionXp,
  discipleshipTierForChapters,
  levelForXp,
  talentsForChapter,
  xpForChapter,
} from '@/modules/gamification';
import { bookNamePt, chaptersInBook } from '@/modules/bible-books';
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
      const user = await userRepository.findByIdForUpdate(db, input.userId);
      if (!user) {
        throw new AppError(ERROR_CODES.USER_NOT_FOUND, 'Usuario nao encontrado.', 404);
      }

      // XP e Talentos do capitulo (por idioma) + bonus de quiz.
      let xp = xpForChapter(input.language);
      let earnedTalents = talentsForChapter(input.language);
      if (input.quizPassed) {
        xp += QUIZ_XP_BONUS;
        earnedTalents += QUIZ_TALENTS_BONUS;
      }

      // Idempotencia do capitulo.
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

      const badgesAwarded: string[] = [];

      // Progresso do desafio (bloqueado).
      const progress = await progressRepository.getOrCreateForUpdate(
        db,
        input.userId,
        input.challengeId,
      );
      const newChaptersRead = progress.chaptersRead + 1;

      // --- Deteccao de conclusao de livro (bonus unico) ---
      let bookCompleted: string | null = null;
      const bookTotal = chaptersInBook(input.bookUsfm);
      if (bookTotal > 0) {
        const readInBook = await progressRepository.countBookChapters(
          db,
          input.userId,
          input.challengeId,
          input.bookUsfm,
        );
        if (readInBook >= bookTotal) {
          const firstTime = await progressRepository.recordBookCompletion(db, {
            userId: input.userId,
            challengeId: input.challengeId,
            bookUsfm: input.bookUsfm,
            xpAwarded: bookCompletionXp(),
            talentsAwarded: bookCompletionTalents(),
          });
          if (firstTime) {
            xp += bookCompletionXp();
            earnedTalents += bookCompletionTalents();
            bookCompleted = input.bookUsfm;
            const label = `Insignia do Livro: ${bookNamePt(input.bookUsfm)}`;
            await userRepository.awardBadge(db, input.userId, `book_${input.bookUsfm}`, label);
            badgesAwarded.push(label);
          }
        }
      }

      // Status do desafio (+ bonus de Biblia toda).
      const status = deriveStatus(newChaptersRead, challenge.totalChapters);
      if (status === 'completed' && progress.status !== 'completed') {
        xp += WHOLE_BIBLE_XP_BONUS;
        await userRepository.awardBadge(db, input.userId, 'palavra_cumprida', 'Palavra Cumprida');
        badgesAwarded.push('Palavra Cumprida');
      }

      const updated = await progressRepository.applyIncrement(db, {
        userId: input.userId,
        challengeId: input.challengeId,
        chaptersDelta: 1,
        xpDelta: xp,
        status,
        completedAt: status === 'completed' ? new Date() : progress.completedAt,
      });

      // XP do usuario + nivel + ofensiva (streak).
      const newTotalXp = user.totalXp + xp;
      await userRepository.addXpAndLevel(db, input.userId, xp, levelForXp(newTotalXp));
      const currentStreak = await userRepository.touchStreak(db, input.userId, new Date());

      // Insignia de marco: Primeiros Passos (primeiro capitulo do usuario).
      if (user.totalXp === 0 && progress.chaptersRead === 0) {
        await userRepository.awardBadge(db, input.userId, 'primeiros_passos', 'Primeiros Passos');
        badgesAwarded.push('Primeiros Passos');
      }

      // Talentos: acumulo + conversao em Biblias.
      const talents = await talentsRepository.getOrCreateForUpdate(db, input.userId);
      await talentsRepository.recordTransaction(db, {
        userId: input.userId,
        kind: TalentTxKind.EARN,
        amount: earnedTalents,
        sourceChallengeId: input.challengeId,
        note: `${input.bookUsfm}.${input.chapter} (${input.language})`,
      });

      const accumulated = talents.balance + earnedTalents;
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

      const tier = discipleshipTierForChapters(updated.chaptersRead);

      // Conquistas de marco do eixo Bíblia: cada nível é creditado uma única vez.
      for (const milestone of DISCIPLESHIP_TIERS.slice(1)) {
        if (progress.chaptersRead < milestone.chaptersRequired && updated.chaptersRead >= milestone.chaptersRequired) {
          const label = `Eixo Bíblia: ${milestone.name}`;
          const awarded = await userRepository.awardBadge(
            db,
            input.userId,
            `discipleship_level_${milestone.level}`,
            label,
          );
          if (awarded) badgesAwarded.push(label);
        }
      }

      return {
        chaptersRead: updated.chaptersRead,
        totalChapters: challenge.totalChapters,
        percentComplete: percentComplete(updated.chaptersRead, challenge.totalChapters),
        xpAwarded: xp,
        totalXp: newTotalXp,
        level: levelForXp(newTotalXp),
        discipleshipLevel: tier.level,
        discipleshipName: tier.name,
        currentStreak,
        talentsBalance: savedTalents.balance,
        biblesDonated: savedTalents.biblesDonated,
        bookCompleted,
        badgesAwarded,
      };
    });
  }
}

export const progressSyncService = new ProgressSyncServiceImpl();
