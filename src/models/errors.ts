/**
 * Formato estruturado de erros e codigos de dominio.
 * Resposta padrao: { error: { code, message, details? } }
 */

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CHALLENGE_NOT_FOUND: 'CHALLENGE_NOT_FOUND',
  CHALLENGE_INACTIVE: 'CHALLENGE_INACTIVE',
  CHAPTER_ALREADY_COMPLETED: 'CHAPTER_ALREADY_COMPLETED',
  INSUFFICIENT_TALENTS: 'INSUFFICIENT_TALENTS',
  YOUVERSION_API_ERROR: 'YOUVERSION_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/** Erro de aplicacao com codigo de dominio e status HTTP. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}
