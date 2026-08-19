import { appDb } from "./client.js";

export function migrate(sqlite = appDb.sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      book_path TEXT NOT NULL,
      status TEXT NOT NULL,
      current_step TEXT NOT NULL,
      step_state TEXT NOT NULL,
      step_started_at TEXT,
      last_error TEXT,
      style TEXT,
      gemini_context_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      portrait_path TEXT,
      portrait_mime_type TEXT,
      portrait_source TEXT,
      generation_state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      illustration_path TEXT,
      illustration_mime_type TEXT,
      illustration_source TEXT,
      generation_state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  addColumnIfMissing(sqlite, "characters", "portrait_mime_type", "TEXT");
  addColumnIfMissing(sqlite, "characters", "portrait_source", "TEXT");
  addColumnIfMissing(sqlite, "chapters", "illustration_mime_type", "TEXT");
  addColumnIfMissing(sqlite, "chapters", "illustration_source", "TEXT");
}

function addColumnIfMissing(sqlite: typeof appDb.sqlite, table: string, column: string, definition: string) {
  const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    sqlite.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  migrate();
  appDb.sqlite.close();
}
