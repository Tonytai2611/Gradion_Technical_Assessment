import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { sessions } from "../../../shared/db/schema.js";
import { nowIso } from "../../../shared/lib/time.js";

export class SessionRepository {
  constructor(private readonly store: AppDb) {}

  create(userId: string) {
    const session = { id: nanoid(), userId, createdAt: nowIso() };
    this.store.db.insert(sessions).values(session).run();
    return session;
  }

  find(id: string) {
    return this.store.db.select().from(sessions).where(eq(sessions.id, id)).get();
  }

  delete(id: string) {
    this.store.db.delete(sessions).where(eq(sessions.id, id)).run();
  }
}
