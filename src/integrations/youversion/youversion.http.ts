/**
 * Implementacao HTTP do YouVersionService usando fetch nativo (Node 18+).
 * Alinhado a YouVersion Platform API (https://developers.youversion.com):
 *  - Autenticacao via header X-YVP-App-Key.
 *  - Livros/capitulos por version_id: /bibles/{version_id}/books[/{usfm}/chapters].
 *  - Versiculo do dia: /verse-of-the-days/{day}.
 * A chave vem exclusivamente da configuracao (variavel de ambiente).
 */
import { AppError, ERROR_CODES, Language } from '@/models';
import { YouVersionService } from './youversion.service';
import {
  BibleBook,
  BibleChapter,
  ReadingPlan,
  VerseOfTheDay,
} from './youversion.types';

export interface YouVersionHttpConfig {
  baseUrl: string;
  apiKey: string;
  /** version_id da Biblia por idioma (ex.: PT=129 NVI, EN=111 NIV). */
  versionId: Record<Language, number>;
}

// --- Formatos parciais das respostas reais da YouVersion Platform ----------
interface YvBook {
  usfm: string;
  // A API pode expor o nome como "title" ou "human"; tratamos ambos.
  title?: string;
  human?: string;
  name?: string;
  chapters?: unknown[];
}
interface YvBooksResponse {
  data?: YvBook[];
  books?: YvBook[];
}
interface YvChapter {
  usfm?: string;
  reference?: { usfm?: string; human?: string };
  human?: string;
  title?: string;
}
interface YvChaptersResponse {
  data?: YvChapter[];
  chapters?: YvChapter[];
}
interface YvVerseOfDay {
  day?: number;
  reference?: { human?: string; usfm?: string };
  reference_human?: string;
  content?: string;
  text?: string;
  date?: string;
}

export class HttpYouVersionService implements YouVersionService {
  constructor(private readonly config: YouVersionHttpConfig) {}

  private async request<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          // Header exigido pela YouVersion Platform. Nunca logamos a chave.
          'X-YVP-App-Key': this.config.apiKey,
          Accept: 'application/json',
        },
      });
    } catch {
      throw new AppError(
        ERROR_CODES.YOUVERSION_API_ERROR,
        'Falha de rede ao contatar a YouVersion API.',
        502,
      );
    }

    if (!res.ok) {
      throw new AppError(
        ERROR_CODES.YOUVERSION_API_ERROR,
        `YouVersion API respondeu com status ${res.status}.`,
        502,
      );
    }

    return (await res.json()) as T;
  }

  private versionFor(language: Language): number {
    return this.config.versionId[language];
  }

  async listBooks(language: Language): Promise<BibleBook[]> {
    const versionId = this.versionFor(language);
    const body = await this.request<YvBooksResponse>(`/bibles/${versionId}/books`);
    const books = body.data ?? body.books ?? [];
    return books.map((b) => ({
      usfm: b.usfm,
      name: b.title ?? b.human ?? b.name ?? b.usfm,
      chapterCount: Array.isArray(b.chapters) ? b.chapters.length : 0,
    }));
  }

  async listChapters(bookUsfm: string, language: Language): Promise<BibleChapter[]> {
    const versionId = this.versionFor(language);
    const body = await this.request<YvChaptersResponse>(
      `/bibles/${versionId}/books/${bookUsfm}/chapters`,
    );
    const chapters = body.data ?? body.chapters ?? [];
    return chapters.map((c, i) => {
      const usfm = c.usfm ?? c.reference?.usfm ?? `${bookUsfm}.${i + 1}`;
      // usfm de capitulo tipicamente "JHN.3" -> extrai o numero.
      const parsed = Number(usfm.split('.').pop());
      return {
        bookUsfm,
        chapter: Number.isFinite(parsed) ? parsed : i + 1,
        reference: c.human ?? c.reference?.human ?? c.title ?? usfm,
      };
    });
  }

  getReadingPlan(_planId: string, _language: Language): Promise<ReadingPlan> {
    // A API de Reading Plans nao esta coberta por este cliente ainda.
    throw new AppError(
      ERROR_CODES.YOUVERSION_API_ERROR,
      'Reading Plans ainda nao implementado no cliente HTTP.',
      501,
    );
  }

  async getVerseOfTheDay(language: Language): Promise<VerseOfTheDay> {
    // Dia do ano (1..366) para o endpoint /verse-of-the-days/{day}.
    const now = new Date();
    const start = Date.UTC(now.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start) / 86_400_000);
    const versionId = this.versionFor(language);

    const body = await this.request<YvVerseOfDay>(
      `/verse-of-the-days/${dayOfYear}`,
      { version_id: String(versionId) },
    );

    return {
      reference: body.reference?.human ?? body.reference_human ?? '',
      text: body.content ?? body.text ?? '',
      language,
      date: body.date ?? now.toISOString().slice(0, 10),
    };
  }
}
