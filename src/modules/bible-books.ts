/**
 * Mapa estatico de capitulos por livro (codigo USFM -> quantidade de capitulos).
 * Fonte de verdade offline para detectar conclusao de livro sem depender de rede.
 * 66 livros, 1.189 capitulos.
 */
export const CHAPTERS_PER_BOOK: Record<string, number> = {
  // Antigo Testamento
  GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, JDG: 21, RUT: 4,
  '1SA': 31, '2SA': 24, '1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36,
  EZR: 10, NEH: 13, EST: 10, JOB: 42, PSA: 150, PRO: 31, ECC: 12, SNG: 8,
  ISA: 66, JER: 52, LAM: 5, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9,
  OBA: 1, JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4,
  // Novo Testamento
  MAT: 28, MRK: 16, LUK: 24, JHN: 21, ACT: 28, ROM: 16, '1CO': 16, '2CO': 13,
  GAL: 6, EPH: 6, PHP: 4, COL: 4, '1TH': 5, '2TH': 3, '1TI': 6, '2TI': 4,
  TIT: 3, PHM: 1, HEB: 13, JAS: 5, '1PE': 5, '2PE': 3, '1JN': 5, '2JN': 1,
  '3JN': 1, JUD: 1, REV: 22,
};

/** Total de capitulos de um livro pelo codigo USFM (0 se desconhecido). */
export function chaptersInBook(bookUsfm: string): number {
  return CHAPTERS_PER_BOOK[bookUsfm.toUpperCase()] ?? 0;
}

/** Nomes amigáveis (PT) dos 66 livros, usados no catálogo e nas insígnias. Fallback = USFM. */
export const BOOK_NAMES_PT: Record<string, string> = {
  GEN: 'Genesis', EXO: 'Exodo', LEV: 'Levitico', NUM: 'Numeros', DEU: 'Deuteronomio',
  JOS: 'Josue', JDG: 'Juizes', RUT: 'Rute', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reis', '2KI': '2 Reis', '1CH': '1 Cronicas', '2CH': '2 Cronicas',
  EZR: 'Esdras', NEH: 'Neemias', EST: 'Ester', JOB: 'Jo', PSA: 'Salmos',
  PRO: 'Proverbios', ECC: 'Eclesiastes', SNG: 'Cantico dos Canticos', ISA: 'Isaias',
  JER: 'Jeremias', LAM: 'Lamentacoes', EZK: 'Ezequiel', DAN: 'Daniel', HOS: 'Oseias',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadias', JON: 'Jonas', MIC: 'Miqueias', NAM: 'Naum',
  HAB: 'Habacuque', ZEP: 'Sofonias', HAG: 'Ageu', ZEC: 'Zacarias', MAL: 'Malaquias',
  MAT: 'Mateus', MRK: 'Marcos', LUK: 'Lucas', JHN: 'Joao', ACT: 'Atos', ROM: 'Romanos',
  '1CO': '1 Corintios', '2CO': '2 Corintios', GAL: 'Galatas', EPH: 'Efesios',
  PHP: 'Filipenses', COL: 'Colossenses', '1TH': '1 Tessalonicenses', '2TH': '2 Tessalonicenses',
  '1TI': '1 Timoteo', '2TI': '2 Timoteo', TIT: 'Tito', PHM: 'Filemom', HEB: 'Hebreus',
  JAS: 'Tiago', '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 Joao', '2JN': '2 Joao',
  '3JN': '3 Joao', JUD: 'Judas', REV: 'Apocalipse',
};

export function bookNamePt(bookUsfm: string): string {
  return BOOK_NAMES_PT[bookUsfm.toUpperCase()] ?? bookUsfm.toUpperCase();
}
