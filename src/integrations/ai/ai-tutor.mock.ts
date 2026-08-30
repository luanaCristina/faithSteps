/**
 * Tutor de IA mockado (default): deterministico, sem chave, sem custo.
 * Deriva conteudo simples do texto do capitulo. Util para dev/demo/testes.
 */
import {
  AiTutorService,
} from './ai-tutor.service';
import {
  ChapterContext,
  ChapterSummary,
  Flashcard,
  QuizQuestion,
} from './ai-tutor.types';

/** Extrai as primeiras N palavras "significativas" do texto. */
function keywords(text: string, n: number): string[] {
  const stop = new Set([
    'the', 'and', 'for', 'that', 'with', 'his', 'her', 'him', 'they', 'them',
    'this', 'from', 'have', 'was', 'were', 'are', 'you', 'your', 'not', 'but',
    'que', 'com', 'para', 'dos', 'das', 'uma', 'nao', 'por', 'seu', 'sua',
  ]);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/\s+/)) {
    const w = raw.replace(/[^A-Za-zÀ-ÿ]/g, '').toLowerCase();
    if (w.length >= 5 && !stop.has(w) && !seen.has(w)) {
      seen.add(w);
      out.push(w);
      if (out.length >= n) break;
    }
  }
  return out;
}

export class MockAiTutorService implements AiTutorService {
  async explainChapter(ctx: ChapterContext): Promise<ChapterSummary> {
    const snippet = ctx.text.trim().slice(0, 160).replace(/\s+\S*$/, '');
    return {
      reference: ctx.reference,
      summaryPt:
        `Resumo de ${ctx.reference}: este capitulo convida a meditar na Palavra. ` +
        `Trecho: "${snippet || 'texto indisponivel'}..."`,
      summaryEn:
        `Summary of ${ctx.reference}: this chapter invites reflection on God's Word. ` +
        `Excerpt: "${snippet || 'text unavailable'}..."`,
      application:
        'Reserve um momento de oracao e aplique uma verdade deste capitulo hoje.',
    };
  }

  async generateQuiz(ctx: ChapterContext, count = 1): Promise<QuizQuestion[]> {
    const base: QuizQuestion[] = [
      {
        question: `Qual atitude a leitura de ${ctx.reference} cultiva?`,
        options: ['Constancia amorosa e fe', 'Ansiedade por desempenho', 'Competicao com o proximo'],
        answerIndex: 0,
      },
      {
        question: 'Qual o foco central da leitura biblica no FaithSteps?',
        options: ['Acumular pontos', 'Formar o carater de Cristo', 'Ganhar de outros usuarios'],
        answerIndex: 1,
      },
      {
        question: 'O que os Talentos acumulados representam?',
        options: ['Moeda para comprar vidas', 'Doacao de Biblias fisicas', 'Ranking competitivo'],
        answerIndex: 1,
      },
    ];
    return base.slice(0, Math.max(1, Math.min(count, base.length)));
  }

  async generateFlashcards(ctx: ChapterContext, count = 4): Promise<Flashcard[]> {
    const words = keywords(ctx.text, count);
    if (words.length === 0) {
      return [{ front: 'grace', back: 'graca' }, { front: 'faith', back: 'fe' }];
    }
    return words.map((w) => ({ front: w, back: `(traducao de "${w}")` }));
  }
}
