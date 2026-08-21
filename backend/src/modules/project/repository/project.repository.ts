import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { projects } from "../../../shared/db/schema.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { ProjectModel } from "../type/project.types.js";

export class ProjectRepository {
  constructor(private readonly store: AppDb) {}

  create(input: { userId: string; title: string; bookPath: string }): ProjectModel {
    const now = nowIso();
    const project: ProjectModel = {
      id: nanoid(),
      userId: input.userId,
      title: input.title,
      bookPath: input.bookPath,
      status: "DRAFT",
      currentStep: "STYLE",
      stepState: "READY",
      stepStartedAt: null,
      lastError: null,
      style: null,
      geminiContextReference: null,
      createdAt: now,
      updatedAt: now
    };
    this.store.db.insert(projects).values(project).run();
    return project;
  }

  updateBookPath(projectId: string, bookPath: string) {
    this.store.db.update(projects).set({ bookPath, updatedAt: nowIso() }).where(eq(projects.id, projectId)).run();
  }

  listForUser(userId: string): ProjectModel[] {
    return this.store.db.select().from(projects).where(eq(projects.userId, userId)).all() as ProjectModel[];
  }

  findById(projectId: string): ProjectModel | undefined {
    return this.store.db.select().from(projects).where(eq(projects.id, projectId)).get() as ProjectModel | undefined;
  }

  findForUser(projectId: string, userId: string): ProjectModel | undefined {
    return this.store.db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).get() as ProjectModel | undefined;
  }

}
