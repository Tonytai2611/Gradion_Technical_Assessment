import type { SessionRepository } from "../repository/session.repository.js";
import type { UserRepository } from "../repository/user.repository.js";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository
  ) {}

  signIn(input: { name: string; email: string }) {
    const user = this.users.upsertByEmail({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase()
    });
    const session = this.sessions.create(user.id);
    return { user, session };
  }

  getSession(sessionId?: string) {
    if (!sessionId) return null;
    const session = this.sessions.find(sessionId);
    if (!session) return null;
    const user = this.users.findById(session.userId);
    return user ? { session, user } : null;
  }

  signOut(sessionId?: string) {
    if (sessionId) this.sessions.delete(sessionId);
  }
}
