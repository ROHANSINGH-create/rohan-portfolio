import { getDb } from "../database/connection.mjs";

export function getCareerGoalByUserId(userId) {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT id, user_id AS userId, career_id AS careerId, note, created_at AS createdAt, updated_at AS updatedAt
         FROM career_goals
         WHERE user_id = ?`
      )
      .get(userId) || null
  );
}

export function upsertCareerGoal(userId, careerId, note = "") {
  const db = getDb();
  db.prepare(
    `INSERT INTO career_goals (user_id, career_id, note, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
      career_id = excluded.career_id,
      note = excluded.note,
      updated_at = datetime('now')`
  ).run(userId, careerId, note);
}
