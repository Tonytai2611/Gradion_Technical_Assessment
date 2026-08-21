import path from "node:path";
import fs from "node:fs";
import { env } from "../../../shared/config/env.js";
import { ensureImageDirs, readTextFile, writeProjectBook } from "../../../shared/lib/filesystem.js";
import { AppError, assertFound } from "../../../shared/lib/errors.js";
import type { ChapterRepository } from "../repository/chapter.repository.js";
import type { CharacterRepository } from "../repository/character.repository.js";
import type { ProjectRepository } from "../repository/project.repository.js";

export class ProjectService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly characters: CharacterRepository,
    private readonly chapters: ChapterRepository,
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

    const project = this.projects.create({ userId, title, bookPath: "__pending__" });
    const bookPath = await writeProjectBook(this.dataRoot, project.id, bookText);
    await ensureImageDirs(this.dataRoot, project.id);
    this.projects.updateBookPath(project.id, bookPath);
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
      characters: this.characters.listForProject(project.id).map((character) => ({
        ...character,
        portraitPath: character.portraitPath ? `/api/projects/${project.id}/images/characters/${path.basename(character.portraitPath)}` : null
      })),
      chapters: this.chapters.listForProject(project.id).map((chapter) => ({
        ...chapter,
        illustrationPath: chapter.illustrationPath ? `/api/projects/${project.id}/images/chapters/${path.basename(chapter.illustrationPath)}` : null
      })),
      isStale
    };
  }

  getImageFile(projectId: string, userId: string, kind: "characters" | "chapters", fileName: string) {
    assertFound(this.projects.findForUser(projectId, userId), "Project not found");
    const imageDir = path.resolve(this.dataRoot, "images", projectId, kind);
    const imagePath = path.resolve(imageDir, fileName);
    if (!imagePath.startsWith(imageDir + path.sep)) {
      throw new AppError(400, "Invalid image path", "VALIDATION_ERROR");
    }
    if (!fs.existsSync(imagePath)) {
      throw new AppError(404, "Image not found", "NOT_FOUND");
    }
    return imagePath;
  }
}
