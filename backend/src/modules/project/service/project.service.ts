import path from "node:path";
import type { AppDb } from "../../../shared/db/client.js";
import { env } from "../../../shared/config/env.js";
import { ensureImageDirs, readTextFile, writeProjectBook } from "../../../shared/lib/filesystem.js";
import { AppError, assertFound } from "../../../shared/lib/errors.js";
import type { ProjectRepository } from "../repository/project.repository.js";

export class ProjectService {
  constructor(
    private readonly store: AppDb,
    private readonly projects: ProjectRepository,
    private readonly dataRoot = path.resolve(process.cwd(), "data")
  ) {}

  list(userId: string) {
    return this.projects.listForUser(userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(userId: string, input: { title: string; bookText: string }) {
    const title = input.title.trim();
    const bookText = input.bookText.trim();
    if (!title) throw new AppError(400, "Project title is required", "VALIDATION_ERROR");
    if (!bookText) throw new AppError(400, "Book text is required", "VALIDATION_ERROR");

    const project = this.store.sqlite.transaction(() => this.projects.create({ userId, title, bookPath: "__pending__" }))();
    const bookPath = await writeProjectBook(this.dataRoot, project.id, bookText);
    await ensureImageDirs(this.dataRoot, project.id);
    this.store.sqlite.prepare("UPDATE projects SET book_path = ?, updated_at = ? WHERE id = ?").run(bookPath, new Date().toISOString(), project.id);
    return assertFound(this.projects.findById(project.id));
  }

  async detail(projectId: string, userId: string, staleAfterMs = env.STEP_STALE_AFTER_MS) {
    const project = assertFound(this.projects.findForUser(projectId, userId), "Project not found");
    const bookText = await readTextFile(project.bookPath);
    const isStale = project.stepState === "RUNNING" && project.stepStartedAt
      ? Date.now() - new Date(project.stepStartedAt).getTime() > staleAfterMs
      : false;
    return {
      ...project,
      bookText,
      characters: this.projects.getCharacters(project.id),
      chapters: this.projects.getChapters(project.id),
      isStale
    };
  }
}
