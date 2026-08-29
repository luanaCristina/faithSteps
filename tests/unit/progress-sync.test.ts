import { AppError, ERROR_CODES, Language, ProgressStatus } from '@/models';

// --- Mocks dos modulos de I/O ---------------------------------------------
jest.mock('@/config/database', () => ({
  // withTransaction apenas executa o callback com um client fake.
  withTransaction: jest.fn((fn: (db: unknown) => unknown) => fn({})),
}));

jest.mock('@/repositories/challenge.repository', () => ({
  challengeRepository: { findById: jest.fn() },
}));
jest.mock('@/repositories/user.repository', () => ({
  userRepository: { findByIdForUpdate: jest.fn(), addXpAndLevel: jest.fn() },
}));
jest.mock('@/repositories/progress.repository', () => ({
  progressRepository: {
    recordChapterCompletion: jest.fn(),
    getOrCreateForUpdate: jest.fn(),
    applyIncrement: jest.fn(),
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
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mockHappyPath() {
  (challengeRepository.findById as jest.Mock).mockResolvedValue(activeChallenge);
  (userRepository.findByIdForUpdate as jest.Mock).mockResolvedValue(user);
  (progressRepository.recordChapterCompletion as jest.Mock).mockResolvedValue(true);
  (progressRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
    chaptersRead: 0,
    completedAt: null,
  });
  (progressRepository.applyIncrement as jest.Mock).mockResolvedValue({
    chaptersRead: 1,
    status: ProgressStatus.IN_PROGRESS,
  });
  (userRepository.addXpAndLevel as jest.Mock).mockResolvedValue(user.totalXp + 25);
  (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
    balance: 0,
    biblesDonated: 0,
  });
  (talentsRepository.recordTransaction as jest.Mock).mockResolvedValue(undefined);
  (talentsRepository.setBalance as jest.Mock).mockResolvedValue({
    balance: 1,
    biblesDonated: 0,
  });
}

describe('ProgressSyncServiceImpl.completeChapter', () => {
  it('credita +25 XP para capitulo em EN e incrementa progresso', async () => {
    mockHappyPath();
    const res = await service.completeChapter(baseInput);

    expect(res.xpAwarded).toBe(25);
    expect(res.totalXp).toBe(75); // 50 + 25
    expect(res.chaptersRead).toBe(1);
    expect(res.totalChapters).toBe(1189);
    expect(talentsRepository.recordTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'EARN', amount: 1 }),
    );
  });

  it('credita +15 XP para capitulo em PT', async () => {
    mockHappyPath();
    const res = await service.completeChapter({ ...baseInput, language: Language.PT });
    expect(res.xpAwarded).toBe(15);
    expect(res.totalXp).toBe(65);
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

  it('registra DONATE e incrementa Biblias quando o saldo atinge a meta', async () => {
    mockHappyPath();
    // saldo prestes a fechar 1 Biblia: 1188 + 1 = 1189
    (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
      balance: 1188,
      biblesDonated: 0,
    });
    (talentsRepository.setBalance as jest.Mock).mockResolvedValue({
      balance: 0,
      biblesDonated: 1,
    });

    const res = await service.completeChapter(baseInput);

    expect(res.biblesDonated).toBe(1);
    expect(res.talentsBalance).toBe(0);
    expect(talentsRepository.recordTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ kind: 'DONATE', amount: 1 }),
    );
  });
});
