import { getDb } from "../database/connection.mjs";

export function listCareers(searchTerm = "") {
  const db = getDb();
  const term = `%${searchTerm.trim().toLowerCase()}%`;

  return db
    .prepare(
      `SELECT id, slug, title, description, difficulty_level AS difficultyLevel,
              entry_level_expectations AS entryLevelExpectations,
              recommended_direction AS recommendedDirection
       FROM careers
       WHERE ? = '%%' OR lower(title) LIKE ? OR lower(description) LIKE ?
       ORDER BY title`
    )
    .all(term, term, term);
}

export function getCareerById(careerId) {
  const db = getDb();
  const career = db
    .prepare(
      `SELECT id, slug, title, description, difficulty_level AS difficultyLevel,
              entry_level_expectations AS entryLevelExpectations,
              recommended_direction AS recommendedDirection
       FROM careers
       WHERE id = ?`
    )
    .get(careerId);
  if (!career) return null;

  const skills = db
    .prepare(
      `SELECT skill_name AS skillName, requirement_type AS requirementType
       FROM career_skills
       WHERE career_id = ?
       ORDER BY skill_name`
    )
    .all(careerId);

  return { ...career, skills };
}
