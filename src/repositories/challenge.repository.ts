/**
 * Repositorio de Desafios: SQL cru + mapeamento snake_case -> camelCase.
 */
import { query } from '@/config/database';
import { Challenge, ChallengeType } from '@/models';

interface ChallengeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  total_chapters: number;
  youversion_plan_id: string | null;
  collective_goal_chapters: number | null;
  starts_at: Date | null;
  ends_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    challengeType: row.challenge_type,
    totalChapters: row.total_chapters,
    youversionPlanId: row.youversion_plan_id,
    collectiveGoalChapters: row.collective_goal_chapters,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateChallengeRow {
  slug: string;
  title: string;
  description: string | null;
  challengeType: ChallengeType;
  totalChapters: number;
  youversionPlanId: string | null;
  collectiveGoalChapters: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
}

export const challengeRepository = {
  async create(input: CreateChallengeRow): Promise<Challenge> {
    const res = await query<ChallengeRow>(
      `INSERT INTO challenges
         (slug, title, description, challenge_type, total_chapters,
          youversion_plan_id, collective_goal_chapters, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.slug,
        input.title,
        input.description,
        input.challengeType,
        input.totalChapters,
        input.youversionPlanId,
        input.collectiveGoalChapters,
        input.startsAt,
        input.endsAt,
      ],
    );
    return toEntity(res.rows[0]);
  },

  async findById(id: string): Promise<Challenge | null> {
    const res = await query<ChallengeRow>('SELECT * FROM challenges WHERE id = $1', [id]);
    return res.rows[0] ? toEntity(res.rows[0]) : null;
  },

  async listActive(type?: ChallengeType): Promise<Challenge[]> {
    if (type) {
      const res = await query<ChallengeRow>(
        'SELECT * FROM challenges WHERE is_active = true AND challenge_type = $1 ORDER BY created_at DESC',
        [type],
      );
      return res.rows.map(toEntity);
    }
    const res = await query<ChallengeRow>(
      'SELECT * FROM challenges WHERE is_active = true ORDER BY created_at DESC',
    );
    return res.rows.map(toEntity);
  },
};
