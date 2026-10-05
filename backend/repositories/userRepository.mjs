import { getDb } from "../database/connection.mjs";

export function createUser() {
  const db = getDb();
  const result = db.prepare("INSERT INTO users DEFAULT VALUES").run();
  return { id: Number(result.lastInsertRowid) };
}

export function findUserById(userId) {
  const db = getDb();
  return (
    db.prepare("SELECT id, created_at AS createdAt FROM users WHERE id = ?").get(userId) ||
    null
  );
}
