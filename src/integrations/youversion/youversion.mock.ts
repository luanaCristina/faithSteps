/**
 * Implementacao mockada do YouVersionService para ambiente de staging/dev.
 * Retorna dados deterministicos sem depender de rede ou de chave de API.
 */
import { Language } from '@/models';
import { YouVersionService } from './youversion.service';
import {
  BibleBook,
  BibleChapter,
  ReadingPlan,
  VerseOfTheDay,
} from './youversion.types';

const BOOKS_PT: BibleBook[] = [
  { usfm: 'GEN', name: 'Genesis', chapterCount: 50 },
  { usfm: 'PSA', name: 'Salmos', chapterCount: 150 },
  { usfm: 'PRO', name: 'Proverbios', chapterCount: 31 },
  { usfm: 'JHN', name: 'Joao', chapterCount: 21 },
];

const BOOKS_EN: BibleBook[] = [
  { usfm: 'GEN', name: 'Genesis', chapterCount: 50 },
  { usfm: 'PSA', name: 'Psalms', chapterCount: 150 },
  { usfm: 'PRO', name: 'Proverbs', chapterCount: 31 },
  { usfm: 'JHN', name: 'John', chapterCount: 21 },
];

export class MockYouVersionService implements YouVersionService {
  async listBooks(language: Language): Promise<BibleBook[]> {
    return language === Language.EN ? BOOKS_EN : BOOKS_PT;
  }

  async listChapters(bookUsfm: string, language: Language): Promise<BibleChapter[]> {
    const books = language === Language.EN ? BOOKS_EN : BOOKS_PT;
    const book = books.find((b) => b.usfm === bookUsfm);
    const count = book?.chapterCount ?? 1;
    const label = book?.name ?? bookUsfm;
    return Array.from({ length: count }, (_, i) => ({
      bookUsfm,
      chapter: i + 1,
      reference: `${label} ${i + 1}`,
    }));
  }

  async getReadingPlan(planId: string, language: Language): Promise<ReadingPlan> {
    // Exemplo: "Evangelhos em 30 dias" (estrutura minima deterministica).
    const days = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      references: [`JHN.${(i % 21) + 1}`],
    }));
    return {
      id: planId,
      title: language === Language.EN ? 'Gospels in 30 days' : 'Evangelhos em 30 dias',
      description:
        language === Language.EN
          ? 'Read through the Gospels in a month.'
          : 'Leia os Evangelhos em um mes.',
      totalDays: 30,
      language,
      days,
    };
  }

  async getVerseOfTheDay(language: Language): Promise<VerseOfTheDay> {
    const date = new Date().toISOString().slice(0, 10);
    return language === Language.EN
      ? {
          reference: 'John 3:16',
          text: 'For God so loved the world...',
          language,
          date,
        }
      : {
          reference: 'Joao 3:16',
          text: 'Porque Deus amou o mundo de tal maneira...',
          language,
          date,
        };
  }
}
