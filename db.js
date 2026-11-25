// Инициализация SQLite-базы данных для проекта «Olympath»
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Гарантируем, что папка data/ существует
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "olympath.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Схема
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id INTEGER PRIMARY KEY,
  profile TEXT NOT NULL DEFAULT '{}',
  tasks TEXT NOT NULL DEFAULT '[]',
  reminders TEXT NOT NULL DEFAULT '[]',
  achievements TEXT NOT NULL DEFAULT '[]',
  universities TEXT NOT NULL DEFAULT '[]',
  favorites TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Подготовленные запросы
const stmts = {
  createUser: db.prepare(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)"
  ),
  getUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  getUserById: db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?"),
  getUserData: db.prepare("SELECT * FROM user_data WHERE user_id = ?"),
  upsertUserData: db.prepare(`
    INSERT INTO user_data (user_id, profile, tasks, reminders, achievements, universities, favorites, updated_at)
    VALUES (@user_id, @profile, @tasks, @reminders, @achievements, @universities, @favorites, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      profile = excluded.profile,
      tasks = excluded.tasks,
      reminders = excluded.reminders,
      achievements = excluded.achievements,
      universities = excluded.universities,
      favorites = excluded.favorites,
      updated_at = datetime('now')
  `)
};

export function createUser({ name, email, passwordHash }) {
  const info = stmts.createUser.run(name, email, passwordHash);
  stmts.upsertUserData.run({
    user_id: info.lastInsertRowid,
    profile: "{}",
    tasks: "[]",
    reminders: "[]",
    achievements: "[]",
    universities: "[]",
    favorites: "[]"
  });
  return stmts.getUserById.get(info.lastInsertRowid);
}

export function findUserByEmail(email) {
  return stmts.getUserByEmail.get(email);
}

export function findUserById(id) {
  return stmts.getUserById.get(id);
}

export function getUserData(userId) {
  const row = stmts.getUserData.get(userId);
  if (!row) return null;
  return {
    profile: safeParse(row.profile, {}),
    tasks: safeParse(row.tasks, []),
    reminders: safeParse(row.reminders, []),
    achievements: safeParse(row.achievements, []),
    universities: safeParse(row.universities, []),
    favorites: safeParse(row.favorites, [])
  };
}

export function saveUserData(userId, data) {
  stmts.upsertUserData.run({
    user_id: userId,
    profile: JSON.stringify(data.profile ?? {}),
    tasks: JSON.stringify(data.tasks ?? []),
    reminders: JSON.stringify(data.reminders ?? []),
    achievements: JSON.stringify(data.achievements ?? []),
    universities: JSON.stringify(data.universities ?? []),
    favorites: JSON.stringify(data.favorites ?? [])
  });
}

function safeParse(text, fallback) {
  try {
    const v = JSON.parse(text);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default db;