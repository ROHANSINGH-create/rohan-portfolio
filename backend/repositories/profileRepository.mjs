import { getDb } from "../database/connection.mjs";

function parseList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stringifyList(value) {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export function createEmptyProfile(userId) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO profiles (user_id) VALUES (?)").run(userId);
}

export function getProfileByUserId(userId) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT user_id AS userId, name, education, degree, current_stage AS currentStage,
              experience_level AS experienceLevel, technical_skills AS technicalSkills,
              non_technical_skills AS nonTechnicalSkills, interests, previous_experience AS previousExperience,
              career_interests AS careerInterests, weekly_learning_hours AS weeklyLearningHours,
              updated_at AS updatedAt
       FROM profiles
       WHERE user_id = ?`
    )
    .get(userId);

  if (!row) return null;

  return {
    ...row,
    technicalSkills: parseList(row.technicalSkills),
    nonTechnicalSkills: parseList(row.nonTechnicalSkills),
    interests: parseList(row.interests),
    careerInterests: parseList(row.careerInterests),
  };
}

export function upsertProfile(userId, profile) {
  const db = getDb();
  db.prepare(
    `INSERT INTO profiles (
      user_id, name, education, degree, current_stage, experience_level,
      technical_skills, non_technical_skills, interests, previous_experience,
      career_interests, weekly_learning_hours, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      name = excluded.name,
      education = excluded.education,
      degree = excluded.degree,
      current_stage = excluded.current_stage,
      experience_level = excluded.experience_level,
      technical_skills = excluded.technical_skills,
      non_technical_skills = excluded.non_technical_skills,
      interests = excluded.interests,
      previous_experience = excluded.previous_experience,
      career_interests = excluded.career_interests,
      weekly_learning_hours = excluded.weekly_learning_hours,
      updated_at = datetime('now')`
  ).run(
    userId,
    profile.name || "",
    profile.education || "",
    profile.degree || "",
    profile.currentStage || "",
    profile.experienceLevel || "",
    stringifyList(profile.technicalSkills),
    stringifyList(profile.nonTechnicalSkills),
    stringifyList(profile.interests),
    profile.previousExperience || "",
    stringifyList(profile.careerInterests),
    Number.isFinite(profile.weeklyLearningHours) ? profile.weeklyLearningHours : 0
  );
}
