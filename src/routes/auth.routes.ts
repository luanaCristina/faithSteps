import { Router } from 'express';
import { z } from 'zod';
import { Language, AppError, ERROR_CODES } from '@/models';
import { validate } from '@/middleware/validate';
import { endSession, publicUser, requireSessionUserId, startSession } from '@/middleware/auth';
import { ensureWholeBibleChallenge } from '@/modules/onboarding';
import { hashPassword, verifyPassword } from '@/modules/passwords';
import { userRepository } from '@/repositories/user.repository';

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  displayName: z.string().trim().min(2).max(120),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.').max(128),
  preferredLanguage: z.nativeEnum(Language).default(Language.PT),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

function authPayload(user: Parameters<typeof publicUser>[0], challenge: { id: string; title: string; totalChapters: number }) {
  return {
    user: publicUser(user),
    challenge: {
      id: challenge.id,
      title: challenge.title,
      totalChapters: challenge.totalChapters,
    },
  };
}

function isUniqueEmailError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505',
  );
}

authRoutes.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof registerSchema>;
    const existing = await userRepository.findByEmailForAuth(body.email);
    if (existing) {
      throw new AppError(ERROR_CODES.EMAIL_IN_USE, 'Este e-mail já está cadastrado.', 409);
    }

    const [user, challenge] = await Promise.all([
      userRepository.createAccount({
        email: body.email.toLowerCase(),
        displayName: body.displayName,
        preferredLanguage: body.preferredLanguage,
        passwordHash: await hashPassword(body.password),
      }),
      ensureWholeBibleChallenge(),
    ]);

    await startSession(res, user.id);
    res.status(201).json(authPayload(user, challenge));
  } catch (err) {
    if (isUniqueEmailError(err)) {
      next(new AppError(ERROR_CODES.EMAIL_IN_USE, 'Este e-mail já está cadastrado.', 409));
      return;
    }
    next(err);
  }
});

authRoutes.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof loginSchema>;
    const credentials = await userRepository.findByEmailForAuth(body.email);
    if (!credentials || !(await verifyPassword(body.password, credentials.passwordHash))) {
      throw new AppError(ERROR_CODES.INVALID_CREDENTIALS, 'E-mail ou senha inválidos.', 401);
    }

    const challenge = await ensureWholeBibleChallenge();
    await startSession(res, credentials.user.id);
    res.json(authPayload(credentials.user, challenge));
  } catch (err) {
    next(err);
  }
});

authRoutes.get('/me', async (req, res, next) => {
  try {
    const userId = await requireSessionUserId(req);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_CODES.AUTH_REQUIRED, 'Sessão inválida. Faça login novamente.', 401);
    }
    const challenge = await ensureWholeBibleChallenge();
    res.json(authPayload(user, challenge));
  } catch (err) {
    next(err);
  }
});

authRoutes.post('/logout', async (req, res, next) => {
  try {
    await endSession(req, res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

