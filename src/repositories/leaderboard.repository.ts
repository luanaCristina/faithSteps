import { pool } from '@/config/database';

export interface RankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  bibleChapters: number;
  englishLessons: number;
  score: number;
}

interface RankingRow {
  rank: string;
  user_id: string;
  display_name: string;
  total_xp: number;
  level: number;
  current_streak: number;
  bible_chapters: string;
  english_lessons: string;
  score: string;
}

const RANKING_CTE = `
  WITH english AS (
    SELECT user_id, COUNT(*)::int AS english_lessons
      FROM english_lesson_completions
     GROUP BY user_id
  ), bible AS (
    SELECT user_id, COUNT(*) FILTER (WHERE language = 'pt')::int AS bible_chapters
      FROM chapter_completions
     GROUP BY user_id
  ), scored AS (
    SELECT u.id AS user_id,
           u.display_name,
           u.total_xp,
           u.level,
           u.current_streak,
           COALESCE(b.bible_chapters, 0)::int AS bible_chapters,
           COALESCE(e.english_lessons, 0)::int AS english_lessons,
           (u.total_xp + COALESCE(e.english_lessons, 0) * 50)::int AS score
      FROM users u
      LEFT JOIN english e ON e.user_id = u.id
      LEFT JOIN bible b ON b.user_id = u.id
     WHERE u.total_xp > 0
        OR COALESCE(e.english_lessons, 0) > 0
        OR COALESCE(b.bible_chapters, 0) > 0
  ), ranked AS (
    SELECT ROW_NUMBER() OVER (ORDER BY score DESC, total_xp DESC, display_name ASC)::int AS rank,
           *
      FROM scored
  )
`;

function toEntry(row: RankingRow): RankingEntry {
  return {
    rank: Number(row.rank),
    userId: row.user_id,
    displayName: row.display_name,
    totalXp: Number(row.total_xp),
    level: Number(row.level),
    currentStreak: Number(row.current_streak),
    bibleChapters: Number(row.bible_chapters),
    englishLessons: Number(row.english_lessons),
    score: Number(row.score),
  };
}

export const leaderboardRepository = {
  async top(limit = 10): Promise<RankingEntry[]> {
    const res = await pool.query<RankingRow>(
      `${RANKING_CTE}
       SELECT rank, user_id, display_name, total_xp, level, current_streak,
              bible_chapters, english_lessons, score
         FROM ranked
        ORDER BY rank
        LIMIT $1`,
      [limit],
    );
    return res.rows.map(toEntry);
  },

  async findUser(userId: string): Promise<RankingEntry | null> {
    const res = await pool.query<RankingRow>(
      `${RANKING_CTE}
       SELECT rank, user_id, display_name, total_xp, level, current_streak,
              bible_chapters, english_lessons, score
         FROM ranked
        WHERE user_id = $1`,
      [userId],
    );
    return res.rows[0] ? toEntry(res.rows[0]) : null;
  },
};
