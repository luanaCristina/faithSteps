/**
 * Implementacao HTTP do YouVersionService usando fetch nativo (Node 18+).
 * A chave de API vem exclusivamente da configuracao (variavel de ambiente).
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
}

export class HttpYouVersionService implements YouVersionService {
  constructor(private readonly config: YouVersionHttpConfig) {}

  private async request<T>(path: string, query: Record<string, string>): Promise<T> {
    const url = new URL(path, this.config.baseUrl);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          // A chave nunca e logada nem retornada nas respostas.
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
        },
      });
    } catch (cause) {
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

  listBooks(language: Language): Promise<BibleBook[]> {
    return this.request<BibleBook[]>('/books', { language });
  }

  listChapters(bookUsfm: string, language: Language): Promise<BibleChapter[]> {
    return this.request<BibleChapter[]>(`/books/${bookUsfm}/chapters`, { language });
  }

  getReadingPlan(planId: string, language: Language): Promise<ReadingPlan> {
    return this.request<ReadingPlan>(`/reading-plans/${planId}`, { language });
  }

  getVerseOfTheDay(language: Language): Promise<VerseOfTheDay> {
    return this.request<VerseOfTheDay>('/verse-of-the-day', { language });
  }
}
