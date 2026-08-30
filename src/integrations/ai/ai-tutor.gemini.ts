/**
 * Tutor de IA usando Google Gemini (REST). Requer GEMINI_API_KEY.
 * Pede saida em JSON e faz parse defensivo. Em falha, o servico de nivel
 * superior deve cair para o mock (fallback), entao aqui apenas lancamos erro.
 */
import { AppError, ERROR_CODES } from '@/models';
import { AiTutorService } from './ai-tutor.service';
import {
  ChapterContext,
  ChapterSummary,
  Flashcard,
  QuizQuestion,
} from './ai-tutor.types';

export interface GeminiConfig {
  apiKey: string;
  model: string; // ex.: 'gemini-1.5-flash'
  baseUrl: string; // ex.: 'https://generativelanguage.googleapis.com/v1beta'
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GeminiAiTutorService implements AiTutorService {
  constructor(private readonly config: GeminiConfig) {}

  /** Chama o modelo e retorna o texto bruto da primeira resposta. */
  private async generate(prompt: string): Promise<string> {
    const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
        }),
      });
    } catch {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Falha de rede ao contatar o Gemini.', 502);
    }
    if (!res.ok) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, `Gemini respondeu ${res.status}.`, 502);
    }
    const body = (await res.json()) as GeminiResponse;
    return body.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  /** Extrai JSON de uma string que pode vir cercada por texto/markdown. */
  private parseJson<T>(raw: string): T {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'Resposta da IA sem JSON valido.', 502);
    }
    return JSON.parse(match[0]) as T;
  }

  async explainChapter(ctx: ChapterContext): Promise<ChapterSummary> {
    const prompt =
      `Voce e um tutor biblico bilingue (PT/EN). Baseado no texto de ${ctx.reference}:\n\n` +
      `"""${ctx.text.slice(0, 4000)}"""\n\n` +
      `Responda SOMENTE com JSON no formato: ` +
      `{"summaryPt": string, "summaryEn": string, "application": string}. ` +
      `Resumos com 2-3 frases, tom pastoral e encorajador, sem inventar fatos.`;
    const parsed = this.parseJson<Omit<ChapterSummary, 'reference'>>(await this.generate(prompt));
    return { reference: ctx.reference, ...parsed };
  }

  async generateQuiz(ctx: ChapterContext, count = 2): Promise<QuizQuestion[]> {
    const prompt =
      `Baseado no texto de ${ctx.reference}:\n"""${ctx.text.slice(0, 4000)}"""\n\n` +
      `Gere ${count} perguntas de multipla escolha (3 opcoes cada) em portugues. ` +
      `Responda SOMENTE com JSON: [{"question": string, "options": [string,string,string], "answerIndex": number}].`;
    const parsed = this.parseJson<QuizQuestion[]>(await this.generate(prompt));
    return Array.isArray(parsed) ? parsed : [];
  }

  async generateFlashcards(ctx: ChapterContext, count = 5): Promise<Flashcard[]> {
    const prompt =
      `Extraia ${count} palavras-chave em INGLES do texto de ${ctx.reference}:\n` +
      `"""${ctx.text.slice(0, 4000)}"""\n\n` +
      `Para cada palavra, de a traducao em portugues. ` +
      `Responda SOMENTE com JSON: [{"front": string, "back": string}].`;
    const parsed = this.parseJson<Flashcard[]>(await this.generate(prompt));
    return Array.isArray(parsed) ? parsed : [];
  }
}
