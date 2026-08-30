import { AppError, ERROR_CODES, Language, ProgressStatus } from '@/models';

// --- Mocks dos modulos de I/O ---------------------------------------------
jest.mock('@/config/database', () => ({
  withTransaction: jest.fn((fn: (db: unknown) => unknown) => fn({})),
}));

jest.mock('@/repositories/challenge.repository', () => ({
  challengeRepository: { findById: jest.fn() },
}));
jest.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findByIdForUpdate: jest.fn(),
    addXpAndLevel: jest.fn(),
    touchStreak: jest.fn(),
    awardBadge: jest.fn(),
  },
}));
jest.mock('@/repositories/progress.repository', () => ({
  progressRepository: {
    recordChapterCompletion: jest.fn(),
    getOrCreateForUpdate: jest.fn(),
    applyIncrement: jest.fn(),
    countBookChapters: jest.fn(),
    recordBookCompletion: jest.fn(),
  },
}));
jest.mock('@/repositories/talents.repository', () => ({
  talentsRepository: {
    getOrCreateForUpdate: jest.fn(),
    recordTransaction: jest.fn(),
    setBalance: jest.fn(),
  },
}));

import { challengeRepository } from '@/repositories/challenge.repository';
import { userRepository } from '@/repositories/user.repository';
import { progressRepository } from '@/repositories/progress.repository';
import { talentsRepository } from '@/repositories/talents.repository';
import { ProgressSyncServiceImpl } from '@/services/progress-sync.impl';

const service = new ProgressSyncServiceImpl();

const baseInput = {
  userId: '11111111-1111-1111-1111-111111111111',
  challengeId: '22222222-2222-2222-2222-222222222222',
  bookUsfm: 'JHN',
  chapter: 3,
  language: Language.EN,
};

const activeChallenge = {
  id: baseInput.challengeId,
  slug: 'biblia-toda',
  title: 'Biblia Toda',
  description: null,
  challengeType: 'WHOLE_BIBLE',
  totalChapters: 1189,
  youversionPlanId: null,
  collectiveGoalChapters: null,
  startsAt: null,
  endsAt: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const user = {
  id: baseInput.userId,
  email: 'a@b.com',
  displayName: 'Ana',
  preferredLanguage: Language.PT,
  totalXp: 50,
  level: 1,
  youversionUserId: null,
  readingMinutes: 0,
  currentStreak: 3,
  lastReadDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockHappyPath() {
  (challengeRepository.findById as jest.Mock).mockResolvedValue(activeChallenge);
  (userRepository.findByIdForUpdate as jest.Mock).mockResolvedValue(user);
  (userRepository.addXpAndLevel as jest.Mock).mockResolvedValue(user.totalXp + 25);
  (userRepository.touchStreak as jest.Mock).mockResolvedValue(4);
  (userRepository.awardBadge as jest.Mock).mockResolvedValue(undefined);
  (progressRepository.recordChapterCompletion as jest.Mock).mockResolvedValue(true);
  (progressRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
    chaptersRead: 5,
    status: ProgressStatus.IN_PROGRESS,
    completedAt: null,
  });
  (progressRepository.applyIncrement as jest.Mock).mockResolvedValue({
    chaptersRead: 6,
    status: ProgressStatus.IN_PROGRESS,
  });
  // Livro nao concluido por padrao (poucos capitulos lidos no livro).
  (progressRepository.countBookChapters as jest.Mock).mockResolvedValue(3);
  (progressRepository.recordBookCompletion as jest.Mock).mockResolvedValue(false);
  (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
    balance: 0,
    biblesDonated: 0,
  });
  (talentsRepository.recordTransaction as jest.Mock).mockResolvedValue(undefined);
  (talentsRepository.setBalance as jest.Mock).mockResolvedValue({
    balance: 4,
    biblesDonated: 0,
  });
}

describe('ProgressSyncServiceImpl.completeChapter', () => {
  it('credita +25 XP e +4 Talentos para capitulo em EN', async () => {
    mockHappyPath();
    const res = await service.completeChapter(baseInput);

    expect(res.xpAwarded).toBe(25);
    expect(res.totalXp).toBe(75); // 50 + 25
    expect(res.chaptersRead).toBe(6);
    expect(res.currentStreak).toBe(4);
    expect(talentsRepository.recordTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'EARN', amount: 4 }),
    );
  });

  it('credita +15 XP e +2 Talentos para capitulo em PT', async () => {
    mockHappyPath();
    const res = await service.completeChapter({ ...baseInput, language: Language.PT });
    expect(res.xpAwarded).toBe(15);
    expect(res.totalXp).toBe(65);
    expect(talentsRepository.recordTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'EARN', amount: 2 }),
    );
  });

  it('quizPassed concede +10 XP extra (EN: 25 + 10 = 35)', async () => {
    mockHappyPath();
    const res = await service.completeChapter({ ...baseInput, quizPassed: true });
    expect(res.xpAwarded).toBe(35);
  });

  it('lanca CHAPTER_ALREADY_COMPLETED quando capitulo ja registrado', async () => {
    mockHappyPath();
    (progressRepository.recordChapterCompletion as jest.Mock).mockResolvedValue(false);
    await expect(service.completeChapter(baseInput)).rejects.toMatchObject({
      code: ERROR_CODES.CHAPTER_ALREADY_COMPLETED,
      statusCode: 409,
    });
  });

  it('lanca CHALLENGE_NOT_FOUND quando desafio nao existe', async () => {
    (challengeRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.completeChapter(baseInput)).rejects.toBeInstanceOf(AppError);
    await expect(service.completeChapter(baseInput)).rejects.toMatchObject({
      code: ERROR_CODES.CHALLENGE_NOT_FOUND,
    });
  });

  it('lanca USER_NOT_FOUND quando usuario nao existe', async () => {
    mockHappyPath();
    (userRepository.findByIdForUpdate as jest.Mock).mockResolvedValue(null);
    await expect(service.completeChapter(baseInput)).rejects.toMatchObject({
      code: ERROR_CODES.USER_NOT_FOUND,
    });
  });

  it('concede bonus de livro (+150 XP) ao concluir o ultimo capitulo do livro', async () => {
    mockHappyPath();
    // JHN tem 21 capitulos; simula que agora completou os 21.
    (progressRepository.countBookChapters as jest.Mock).mockResolvedValue(21);
    (progressRepository.recordBookCompletion as jest.Mock).mockResolvedValue(true);

    const res = await service.completeChapter({ ...baseInput, chapter: 21 });
    // EN (25) + bonus de livro (150) = 175
    expect(res.xpAwarded).toBe(175);
    expect(res.bookCompleted).toBe('JHN');
    expect(res.badgesAwarded.some((b) => b.includes('Joao'))).toBe(true);
  });

  it('registra DONATE quando o saldo de Talentos atinge 1000', async () => {
    mockHappyPath();
    // saldo 998 + 4 (EN) = 1002 -> 1 Biblia, resto 2
    (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
      balance: 998,
      biblesDonated: 0,
    });
    (talentsRepository.setBalance as jest.Mock).mockResolvedValue({
      balance: 2,
      biblesDonated: 1,
    });

    const res = await service.completeChapter(baseInput);

    expect(res.biblesDonated).toBe(1);
    expect(res.talentsBalance).toBe(2);
    expect(talentsRepository.recordTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'DONATE', amount: 1 }),
    );
  });
});
