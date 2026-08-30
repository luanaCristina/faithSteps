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

/** Lição de Inglês contextualizada por uma passagem bíblica. */
export interface EnglishLesson {
  id: string;
  level: string;
  title: string;
  description: string;
  reference: string;
  focus: string;
  vocabulary: string[];
  verse: string;
  practice: string;
}

/** Módulo da jornada progressiva de Inglês. */
export interface EnglishModule {
  id: string;
  name: string;
  level: string;
  description: string;
  lessons: EnglishLesson[];
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

/** Jornada progressiva de Inglês com a Bíblia como texto-base. */
export const ENGLISH_JOURNEY: EnglishModule[] = [
  {
    id: 'first-steps', name: 'First Steps', level: 'A1/A2',
    description: 'Vocabulário essencial e frases simples para começar a ler a Bíblia em inglês.',
    lessons: [
      { id: 'eng-01', level: 'A1/A2', title: 'In the beginning', description: 'Conheça palavras para falar sobre o começo da criação.', reference: 'GEN.1', focus: 'There is / There are', vocabulary: ['beginning', 'created', 'light', 'earth'], verse: 'In the beginning God created the heavens and the earth.', practice: 'Escreva uma frase usando “In the beginning”.' },
      { id: 'eng-02', level: 'A1/A2', title: 'God is love', description: 'Aprenda a descrever pessoas e verdades de fé com o verbo to be.', reference: '1JN.4', focus: 'Verb to be + adjectives', vocabulary: ['love', 'perfect', 'known', 'beloved'], verse: 'God is love.', practice: 'Complete: “God is ___.”' },
      { id: 'eng-03', level: 'A1/A2', title: 'A faithful prayer', description: 'Use verbos simples para falar sobre sua rotina de oração.', reference: 'MAT.6', focus: 'Simple present', vocabulary: ['pray', 'heaven', 'daily', 'forgive'], verse: 'Give us this day our daily bread.', practice: 'Escreva três ações que você faz todos os dias.' },
      { id: 'eng-04', level: 'A1/A2', title: 'The good shepherd', description: 'Pratique pronomes e posse com uma imagem conhecida dos Salmos.', reference: 'PSA.23', focus: 'Pronouns + possessives', vocabulary: ['shepherd', 'sheep', 'valley', 'restore'], verse: 'The Lord is my shepherd.', practice: 'Substitua “my” por “your” em uma frase.' },
    ],
  },
  {
    id: 'walking-with-jesus', name: 'Walking with Jesus', level: 'A2/B1',
    description: 'Leitura guiada dos Evangelhos para ampliar compreensão e formar frases.',
    lessons: [
      { id: 'eng-05', level: 'A2/B1', title: 'Follow me', description: 'Entenda convites e instruções no contexto do chamado dos discípulos.', reference: 'MAT.4', focus: 'Imperatives', vocabulary: ['follow', 'fishermen', 'immediately', 'net'], verse: 'Follow me, and I will make you fishers of men.', practice: 'Transforme “You follow Jesus” em um convite.' },
      { id: 'eng-06', level: 'A2/B1', title: 'The Beatitudes', description: 'Aprenda a reconhecer quem é descrito em uma frase em inglês.', reference: 'MAT.5', focus: 'Adjectives + who', vocabulary: ['blessed', 'meek', 'mercy', 'righteousness'], verse: 'Blessed are the peacemakers.', practice: 'Explique em português quem são os peacemakers.' },
      { id: 'eng-07', level: 'A2/B1', title: 'A new commandment', description: 'Fale sobre ações em andamento e o amor como prática.', reference: 'JHN.13', focus: 'Present continuous', vocabulary: ['commandment', 'serve', 'love', 'one another'], verse: 'Love one another, just as I have loved you.', practice: 'Escreva uma ação de serviço usando “I am serving”.' },
      { id: 'eng-08', level: 'A2/B1', title: 'Peace in the storm', description: 'Conte acontecimentos passados e descreva uma mudança de situação.', reference: 'MRK.4', focus: 'Simple past', vocabulary: ['storm', 'boat', 'waves', 'quiet'], verse: 'He got up, rebuked the wind and said to the sea, “Quiet!”', practice: 'Conte em uma frase o que aconteceu depois da oração.' },
    ],
  },
  {
    id: 'truth-that-transforms', name: 'Truth that transforms', level: 'B1/B2',
    description: 'Vocabulário de caráter, fé e transformação para ler textos mais densos.',
    lessons: [
      { id: 'eng-09', level: 'B1/B2', title: 'A living hope', description: 'Identifique ideias principais e relações de causa em um texto apostólico.', reference: '1PE.1', focus: 'Connectors: because / therefore', vocabulary: ['hope', 'inheritance', 'revealed', 'trial'], verse: 'He has given us new birth into a living hope.', practice: 'Una duas frases usando “because”.' },
      { id: 'eng-10', level: 'B1/B2', title: 'The fruit of the Spirit', description: 'Amplie o vocabulário de virtudes e compare hábitos de vida.', reference: 'GAL.5', focus: 'Nouns and abstract ideas', vocabulary: ['fruit', 'kindness', 'faithfulness', 'self-control'], verse: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control.', practice: 'Escolha uma virtude e descreva como praticá-la.' },
      { id: 'eng-11', level: 'B1/B2', title: 'Renew your mind', description: 'Pratique conselhos e linguagem de mudança de comportamento.', reference: 'ROM.12', focus: 'Should / should not', vocabulary: ['renew', 'mind', 'discern', 'conform'], verse: 'Be transformed by the renewing of your mind.', practice: 'Escreva um conselho usando “You should”.' },
      { id: 'eng-12', level: 'B1/B2', title: 'A servant leader', description: 'Compreenda como humildade e liderança aparecem no mesmo argumento.', reference: 'PHP.2', focus: 'Comparatives and contrast', vocabulary: ['humble', 'servant', 'obedient', 'exalted'], verse: 'He humbled himself by becoming obedient to death.', practice: 'Compare “power” e “service” em uma frase.' },
    ],
  },
  {
    id: 'discipleship-and-service', name: 'Discipleship & service', level: 'B2/C1',
    description: 'Textos para desenvolver autonomia, interpretação e comunicação cristã.',
    lessons: [
      { id: 'eng-13', level: 'B2/C1', title: 'The armor of God', description: 'Leia uma enumeração de imagens e identifique sua função no argumento.', reference: 'EPH.6', focus: 'Compound nouns', vocabulary: ['armor', 'shield', 'salvation', 'sword'], verse: 'Take up the shield of faith.', practice: 'Explique em inglês o que um “shield” representa.' },
      { id: 'eng-14', level: 'B2/C1', title: 'A faithful witness', description: 'Estude como evidências e testemunhos são apresentados em Atos.', reference: 'ACT.1', focus: 'Present perfect', vocabulary: ['witness', 'receive', 'power', 'ends'], verse: 'You will receive power when the Holy Spirit has come upon you.', practice: 'Use “I have learned” para contar uma aprendizagem.' },
      { id: 'eng-15', level: 'B2/C1', title: 'Wisdom from above', description: 'Interprete contrastes entre sabedoria terrena e sabedoria do alto.', reference: 'JAS.3', focus: 'Contrasts and discourse markers', vocabulary: ['wisdom', 'peaceable', 'pure', 'harvest'], verse: 'The wisdom from above is first pure, then peaceable.', practice: 'Complete: “True wisdom is not only ___, but also ___.”' },
      { id: 'eng-16', level: 'B2/C1', title: 'The ministry of reconciliation', description: 'Aprenda linguagem abstrata para falar sobre missão e reconciliação.', reference: '2CO.5', focus: 'Passive voice', vocabulary: ['reconciliation', 'ambassador', 'become', 'appeal'], verse: 'We are ambassadors for Christ.', practice: 'Reescreva uma frase usando a voz passiva.' },
    ],
  },
  {
    id: 'exegesis-and-leadership', name: 'Exegesis & leadership', level: 'C1/C2',
    description: 'Leitura avançada para análise de contexto, ensino e liderança servidora.',
    lessons: [
      { id: 'eng-17', level: 'C1/C2', title: 'Handle the word of truth', description: 'Analise precisão, contexto e responsabilidade ao ensinar as Escrituras.', reference: '2TI.2', focus: 'Academic vocabulary', vocabulary: ['approved', 'accurately', 'truth', 'worker'], verse: 'Present yourself to God as one approved, a worker who has no need to be ashamed.', practice: 'Resuma o princípio em duas frases em inglês.' },
      { id: 'eng-18', level: 'C1/C2', title: 'The whole counsel of God', description: 'Pratique síntese e leitura panorâmica de uma missão de ensino.', reference: 'ACT.20', focus: 'Cohesion and summary', vocabulary: ['declare', 'counsel', 'elders', 'innocent'], verse: 'I did not shrink from declaring to you the whole counsel of God.', practice: 'Faça um resumo usando “therefore” e “however”.' },
      { id: 'eng-19', level: 'C1/C2', title: 'A kingdom without fear', description: 'Explore metáforas, promessa e esperança em um texto profético.', reference: 'REV.21', focus: 'Metaphor and future meaning', vocabulary: ['dwelling', 'wipe away', 'mourning', 'former'], verse: 'He will wipe away every tear from their eyes.', practice: 'Explique a metáfora “wipe away every tear”.' },
      { id: 'eng-20', level: 'C1/C2', title: 'Teach and encourage', description: 'Conclua a jornada aplicando leitura, ensino e encorajamento.', reference: 'COL.3', focus: 'Relative clauses', vocabulary: ['teach', 'admonish', 'wisdom', 'gratitude'], verse: 'Teach and admonish one another in all wisdom.', practice: 'Escreva uma frase com “one another” sobre a comunidade.' },
    ],
  },
];

export function findEnglishLesson(id: string): EnglishLesson | null {
  for (const module of ENGLISH_JOURNEY) {
    const lesson = module.lessons.find((item) => item.id === id);
    if (lesson) return lesson;
  }
  return null;
}

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
    english: {
      title: 'Jornada de Inglês com a Bíblia',
      description: 'Lições progressivas de inglês a partir de passagens bíblicas.',
      totalLessons: ENGLISH_JOURNEY.reduce((total, module) => total + module.lessons.length, 0),
      modules: ENGLISH_JOURNEY,
    },
    thematic: THEMATIC_TRACKS,
  };
}
