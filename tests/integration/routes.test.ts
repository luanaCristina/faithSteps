// Usa o cliente YouVersion mockado (sem rede) via config.
process.env.YOUVERSION_USE_MOCK = 'true';

import request from 'supertest';
import { Language } from '@/models';

// --- Mock das camadas de dados/servico (sem Postgres real) -----------------
jest.mock('@/services/progress-sync.impl', () => ({
  progressSyncService: { completeChapter: jest.fn() },
}));
jest.mock('@/repositories/challenge.repository', () => ({
  challengeRepository: { listActive: jest.fn(), findById: jest.fn() },
}));
jest.mock('@/config/database', () => ({
  withTransaction: jest.fn((fn: (db: unknown) => unknown) => fn({})),
  pool: {},
}));
jest.mock('@/repositories/user.repository', () => ({
  userRepository: { findByIdForUpdate: jest.fn() },
}));
jest.mock('@/repositories/talents.repository', () => ({
  talentsRepository: { getOrCreateForUpdate: jest.fn(), debitForDonation: jest.fn() },
}));

import { app } from '@/app';
import { progressSyncService } from '@/services/progress-sync.impl';
import { challengeRepository } from '@/repositories/challenge.repository';
import { userRepository } from '@/repositories/user.repository';
import { talentsRepository } from '@/repositories/talents.repository';

const USER = '11111111-1111-1111-1111-111111111111';
const CHALLENGE = '22222222-2222-2222-2222-222222222222';

describe('API FaithSteps (integracao)', () => {
  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/bible/books usa o mock e retorna livros', async () => {
    const res = await request(app).get('/api/bible/books').query({ language: 'pt' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((b: { usfm: string }) => b.usfm === 'JHN')).toBe(true);
  });

  it('GET /api/bible/books rejeita idioma invalido (400 VALIDATION_ERROR)', async () => {
    const res = await request(app).get('/api/bible/books').query({ language: 'fr' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/challenges lista desafios ativos', async () => {
    (challengeRepository.listActive as jest.Mock).mockResolvedValue([
      { id: CHALLENGE, slug: 'biblia-toda', title: 'Biblia Toda' },
    ]);
    const res = await request(app).get('/api/challenges');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('POST /api/progress/complete-chapter valida o corpo (400)', async () => {
    const res = await request(app)
      .post('/api/progress/complete-chapter')
      .send({ userId: 'nao-uuid', challengeId: CHALLENGE, bookUsfm: 'JHN', chapter: 3, language: 'en' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/progress/complete-chapter delega ao service (201)', async () => {
    (progressSyncService.completeChapter as jest.Mock).mockResolvedValue({
      chaptersRead: 1,
      totalChapters: 1189,
      percentComplete: 0.08,
      xpAwarded: 25,
      totalXp: 25,
      talentsBalance: 1,
      biblesDonated: 0,
    });

    const res = await request(app)
      .post('/api/progress/complete-chapter')
      .send({
        userId: USER,
        challengeId: CHALLENGE,
        bookUsfm: 'JHN',
        chapter: 3,
        language: Language.EN,
      });

    expect(res.status).toBe(201);
    expect(res.body.xpAwarded).toBe(25);
    expect(progressSyncService.completeChapter).toHaveBeenCalledTimes(1);
  });

  it('POST /api/progress/donate rejeita saldo insuficiente (409)', async () => {
    (userRepository.findByIdForUpdate as jest.Mock).mockResolvedValue({ id: USER });
    (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
      balance: 10,
      biblesDonated: 0,
    });

    const res = await request(app)
      .post('/api/progress/donate')
      .send({ userId: USER, bibles: 1 }); // custo 1189 > saldo 10

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_TALENTS');
  });

  it('POST /api/progress/donate efetua a doacao quando ha saldo', async () => {
    (userRepository.findByIdForUpdate as jest.Mock).mockResolvedValue({ id: USER });
    (talentsRepository.getOrCreateForUpdate as jest.Mock).mockResolvedValue({
      balance: 1189,
      biblesDonated: 0,
    });
    (talentsRepository.debitForDonation as jest.Mock).mockResolvedValue({
      balance: 0,
      biblesDonated: 1,
    });

    const res = await request(app)
      .post('/api/progress/donate')
      .send({ userId: USER, bibles: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ biblesDonated: 1, talentsBalance: 0 });
  });
});
