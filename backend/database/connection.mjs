import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { runMigrations } from "./migrations.mjs";

const DATABASE_DIR = resolve("database");
const DATABASE_PATH = resolve(DATABASE_DIR, "career_guidance.db");

let db;

export function getDb() {
  if (db) return db;

  mkdirSync(DATABASE_DIR, { recursive: true });
  db = new DatabaseSync(DATABASE_PATH);
  db.exec("PRAGMA foreign_keys = ON");
  runMigrations(db);
  return db;
}
