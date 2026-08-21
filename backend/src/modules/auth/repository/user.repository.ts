import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { users } from "../../../shared/db/schema.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { UserModel } from "../type/auth.types.js";

export class UserRepository {
  constructor(private readonly store: AppDb) {}

  findByEmail(email: string): UserModel | undefined {
    return this.store.db.select().from(users).where(eq(users.email, email)).get() as UserModel | undefined;
  }

  findById(id: string): UserModel | undefined {
    return this.store.db.select().from(users).where(eq(users.id, id)).get() as UserModel | undefined;
  }

  upsertByEmail(input: { name: string; email: string }): UserModel {
    const existing = this.findByEmail(input.email);
    const now = nowIso();
    if (existing) {
      this.store.db.update(users).set({ name: input.name, updatedAt: now }).where(eq(users.id, existing.id)).run();
      return { ...existing, name: input.name, updatedAt: now };
    }
    const user: UserModel = {
      id: nanoid(),
      name: input.name,
      email: input.email,
      createdAt: now,
      updatedAt: now
    };
    this.store.db.insert(users).values(user).run();
    return user;
  }
}
