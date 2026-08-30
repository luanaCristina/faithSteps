import { createHash, randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { config } from '@/config';
import { AppError, ERROR_CODES } from '@/models';
import { authSessionRepository } from '@/repositories/auth-session.repository';

export const SESSION_COOKIE = 'fs_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie ?? '';
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null;
}

export async function getSessionUserId(req: Request): Promise<string | null> {
  const token = readSessionToken(req);
  return token ? authSessionRepository.findUserIdByTokenHash(hashToken(token)) : null;
}

export async function requireSessionUserId(req: Request): Promise<string> {
  const userId = await getSessionUserId(req);
  if (!userId) {
    throw new AppError(ERROR_CODES.AUTH_REQUIRED, 'Faça login para continuar.', 401);
  }
  return userId;
}

/** Usa a sessão quando presente; o fallback mantém compatibilidade com clientes legados. */
export async function resolveUserId(req: Request, fallbackUserId: string): Promise<string> {
  const token = readSessionToken(req);
  if (!token) return fallbackUserId;
  const sessionUserId = await authSessionRepository.findUserIdByTokenHash(hashToken(token));
  if (!sessionUserId) {
    throw new AppError(ERROR_CODES.AUTH_REQUIRED, 'Sessão inválida. Faça login novamente.', 401);
  }
  if (sessionUserId !== fallbackUserId) {
    throw new AppError(ERROR_CODES.AUTH_REQUIRED, 'A sessão não corresponde ao usuário informado.', 401);
  }
  return sessionUserId;
}

export async function startSession(res: Response, userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await authSessionRepository.create(userId, hashToken(token), expiresAt);
  const secure = config.nodeEnv === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

export async function endSession(req: Request, res: Response): Promise<void> {
  const token = readSessionToken(req);
  if (token) await authSessionRepository.deleteByTokenHash(hashToken(token));
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${config.nodeEnv === 'production' ? '; Secure' : ''}`,
  );
}

export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: string;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    preferredLanguage: user.preferredLanguage,
  };
}
