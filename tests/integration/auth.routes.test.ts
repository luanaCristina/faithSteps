process.env.YOUVERSION_USE_MOCK = 'true';

import request from 'supertest';
import { Language } from '@/models';

jest.mock('@/repositories/auth-session.repository', () => ({
  authSessionRepository: {
    create: jest.fn(),
    findUserIdByTokenHash: jest.fn(),
    deleteByTokenHash: jest.fn(),
  },
}));
jest.mock('@/repositories/challenge.repository', () => ({
  challengeRepository: { listActive: jest.fn(), findById: jest.fn() },
}));
jest.mock('@/repositories/user.repository', () => ({
  userRepository: {
    findByEmailForAuth: jest.fn(),
    createAccount: jest.fn(),
    findById: jest.fn(),
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
import { challengeRepository } from '@/repositories/challenge.repository';
import { userRepository } from '@/repositories/user.repository';

const CHALLENGE = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Biblia Toda',
  totalChapters: 1189,
};

const USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'conta@faithsteps.dev',
  displayName: 'Conta Teste',
  preferredLanguage: Language.PT,
  totalXp: 0,
  level: 1,
  youversionUserId: null,
  readingMinutes: 0,
  currentStreak: 0,
  lastReadDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('API de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (challengeRepository.listActive as jest.Mock).mockResolvedValue([CHALLENGE]);
    (userRepository.findByEmailForAuth as jest.Mock).mockResolvedValue(null);
    (userRepository.createAccount as jest.Mock).mockResolvedValue(USER);
    (authSessionRepository.create as jest.Mock).mockResolvedValue(undefined);
  });

  it('rejeita senha menor que oito caracteres no cadastro', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'conta@faithsteps.dev',
      displayName: 'Conta Teste',
      password: 'curta',
      preferredLanguage: 'pt',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(userRepository.createAccount).not.toHaveBeenCalled();
  });

  it('cria conta, inicia sessão e retorna apenas dados públicos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'conta@faithsteps.dev',
      displayName: 'Conta Teste',
      password: 'senha-segura-123',
      preferredLanguage: 'pt',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: USER.id,
      email: USER.email,
      displayName: USER.displayName,
      preferredLanguage: USER.preferredLanguage,
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toContain('fs_session=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(authSessionRepository.create).toHaveBeenCalledTimes(1);
  });

  it('não revela se um e-mail existe no login inválido', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'conta@faithsteps.dev',
      password: 'senha-incorreta',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
