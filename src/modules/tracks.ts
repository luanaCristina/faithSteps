/**
 * Estrutura das Trilhas do Conhecimento (documento V2 - Entrega A).
 * Dois eixos (Biblia e Ingles) + a Trilha Principal (66 livros por secao)
 * e as Trilhas Tematicas Especiais. Dados estaticos (sem I/O).
 */
import { bookNamePt, chaptersInBook } from './bible-books';

/** Eixo de aprendizado. */
export interface LearningAxis {
  id: 'bible' | 'english';
  name: string;
  description: string;
}

export const AXES: LearningAxis[] = [
  {
    id: 'bible',
    name: 'Biblia',
    description: 'Leitura e estudo da Palavra, dos 66 livros as trilhas tematicas.',
  },
  {
    id: 'english',
    name: 'Ingles',
    description: 'Aprendizado bilingue de ingles usando a Biblia como base.',
  },
];

/** Um livro dentro de uma secao. */
export interface TrackBook {
  usfm: string;
  name: string;
  chapters: number;
}

/** Secao da Trilha Principal (agrupamento canonico dos livros). */
export interface BibleSection {
  id: string;
  name: string;
  books: TrackBook[];
}

function books(...usfms: string[]): TrackBook[] {
  return usfms.map((usfm) => ({
    usfm,
    name: bookNamePt(usfm),
    chapters: chaptersInBook(usfm),
  }));
}

/** Trilha Principal: os 66 livros organizados por secao canonica. */
export const BIBLE_SECTIONS: BibleSection[] = [
  {
    id: 'pentateuco',
    name: 'Pentateuco',
    books: books('GEN', 'EXO', 'LEV', 'NUM', 'DEU'),
  },
  {
    id: 'historicos',
    name: 'Historicos',
    books: books('JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST'),
  },
  {
    id: 'poeticos',
    name: 'Poeticos e Sabedoria',
    books: books('JOB', 'PSA', 'PRO', 'ECC', 'SNG'),
  },
  {
    id: 'profetas-maiores',
    name: 'Profetas Maiores',
    books: books('ISA', 'JER', 'LAM', 'EZK', 'DAN'),
  },
  {
    id: 'profetas-menores',
    name: 'Profetas Menores',
    books: books('HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'),
  },
  {
    id: 'evangelhos-atos',
    name: 'Evangelhos e Atos',
    books: books('MAT', 'MRK', 'LUK', 'JHN', 'ACT'),
  },
  {
    id: 'cartas',
    name: 'Cartas (Epistolas)',
    books: books('ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD'),
  },
  {
    id: 'apocalipse',
    name: 'Apocalipse',
    books: books('REV'),
  },
];

/** Trilha Tematica Especial (modulos praticos fundamentados na Biblia). */
export interface ThematicTrack {
  id: string;
  name: string;
  description: string;
  /** Referencias-chave (USFM de capitulos) que compoem o modulo. */
  references: string[];
}

export const THEMATIC_TRACKS: ThematicTrack[] = [
  {
    id: 'discipulado-vida-crista',
    name: 'Discipulado e Vida Crista',
    description: 'Fundamentos de seguir a Jesus no dia a dia.',
    references: ['MAT.5', 'MAT.6', 'JHN.15', 'ROM.12', 'GAL.5'],
  },
  {
    id: 'pregacao-hermeneutica',
    name: 'Pregacao e Hermeneutica da Palavra',
    description: 'Como interpretar e comunicar as Escrituras com fidelidade.',
    references: ['2TI.2', '2TI.3', '2TI.4', 'ACT.17', 'NEH.8'],
  },
  {
    id: 'sabedoria-proverbios',
    name: 'Sabedoria e Proverbios',
    description: 'Vida pratica guiada pela sabedoria biblica.',
    references: ['PRO.1', 'PRO.3', 'PRO.16', 'PRO.31', 'JAS.1'],
  },
  {
    id: 'familia-casamento-filhos',
    name: 'Familia, Casamento e Criacao de Filhos',
    description: 'Principios biblicos para o lar.',
    references: ['GEN.2', 'EPH.5', 'EPH.6', 'PRO.22', 'DEU.6'],
  },
  {
    id: 'historia-contexto',
    name: 'Historia e Contexto Biblico',
    description: 'O pano de fundo historico e cultural das Escrituras.',
    references: ['GEN.12', 'EXO.20', '2SA.7', 'DAN.2', 'ACT.2'],
  },
];

/** Monta a estrutura completa das trilhas para o frontend. */
export function buildTracks() {
  return {
    axes: AXES,
    bible: {
      title: 'Trilha Principal - Biblia Completa',
      totalBooks: BIBLE_SECTIONS.reduce((n, s) => n + s.books.length, 0),
      sections: BIBLE_SECTIONS,
    },
    thematic: THEMATIC_TRACKS,
  };
}
