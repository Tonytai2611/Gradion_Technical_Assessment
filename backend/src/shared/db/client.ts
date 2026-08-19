import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import * as schema from "./schema.js";

export function createSqlite(databasePath = env.DATABASE_PATH) {
  const dir = path.dirname(databasePath);
  fs.mkdirSync(dir, { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

export function createDb(databasePath = env.DATABASE_PATH) {
  const sqlite = createSqlite(databasePath);
  return {
    sqlite,
    db: drizzle(sqlite, { schema })
  };
}

export type AppDb = ReturnType<typeof createDb>;

export const appDb = createDb();
