process.env.YOUVERSION_USE_MOCK = 'true';

import request from 'supertest';

jest.mock('@/repositories/auth-session.repository', () => ({
  authSessionRepository: {
    create: jest.fn(),
    findUserIdByTokenHash: jest.fn(),
    deleteByTokenHash: jest.fn(),
  },
}));
jest.mock('@/repositories/progress.repository', () => ({
  progressRepository: {
    completeEnglishLesson: jest.fn(),
    englishLessonProgress: jest.fn(),
  },
}));
jest.mock('@/repositories/challenge.repository', () => ({
  challengeRepository: { listActive: jest.fn(), findById: jest.fn() },
}));
jest.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
    findByEmailForAuth: jest.fn(),
    createAccount: jest.fn(),
    findByIdForUpdate: jest.fn(),
  },
}));
jest.mock('@/config/database', () => ({
  withTransaction: jest.fn((fn: (db: unknown) => unknown) => fn({})),
  pool: {},
}));
jest.mock('@/services/progress-sync.impl', () => ({
  progressSyncService: { completeChapter: jest.fn() },
}));
jest.mock('@/repositories/talents.repository', () => ({
  talentsRepository: { getOrCreateForUpdate: jest.fn(), debitForDonation: jest.fn() },
}));

import { app } from '@/app';
import { authSessionRepository } from '@/repositories/auth-session.repository';
import { progressRepository } from '@/repositories/progress.repository';

const USER = '11111111-1111-1111-1111-111111111111';

describe('API da jornada de Inglês', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authSessionRepository.findUserIdByTokenHash as jest.Mock).mockResolvedValue(USER);
    (progressRepository.completeEnglishLesson as jest.Mock).mockResolvedValue(true);
  });

  it('exige uma sessão para concluir a lição', async () => {
    (authSessionRepository.findUserIdByTokenHash as jest.Mock).mockResolvedValue(null);

    const res = await request(app).post('/api/english/lessons/eng-01/complete').send();

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
    expect(progressRepository.completeEnglishLesson).not.toHaveBeenCalled();
  });

  it('conclui uma lição válida e associa a conclusão ao usuário da sessão', async () => {
    const res = await request(app)
      .post('/api/english/lessons/eng-01/complete')
      .set('Cookie', 'fs_session=test-token')
      .send();

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ lessonId: 'eng-01', completed: true, newlyCompleted: true });
    expect(progressRepository.completeEnglishLesson).toHaveBeenCalledWith(USER, 'eng-01');
  });

  it('rejeita uma lição que não existe na jornada', async () => {
    const res = await request(app)
      .post('/api/english/lessons/eng-99/complete')
      .set('Cookie', 'fs_session=test-token')
      .send();

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
