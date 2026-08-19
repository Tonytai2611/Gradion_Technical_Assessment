import { readTextFile } from "../../../shared/lib/filesystem.js";
import { AppError, assertFound } from "../../../shared/lib/errors.js";
import type { ProjectRepository } from "../../project/repository/project.repository.js";
import type { CharacterModel } from "../../project/type/project.types.js";
import { parseContext, type ImageGenerationProvider, type TextGenerationProvider } from "./gemini.service.js";
import type { PipelineRepository } from "../repository/pipeline.repository.js";
import { nextStep, type PipelineStep } from "../type/pipeline.types.js";
import fs from "node:fs/promises";

export class PipelineService {
  constructor(
    private readonly pipeline: PipelineRepository,
    private readonly projects: ProjectRepository,
    private readonly textProvider: TextGenerationProvider,
    private readonly imageProvider: ImageGenerationProvider,
    private readonly staleAfterMs: number
  ) {}

  async runStep(projectId: string, userId: string, step: PipelineStep, options: { customStyle?: string } = {}) {
    const project = assertFound(this.projects.findForUser(projectId, userId), "Project not found");
    if (project.currentStep !== step) {
      throw new AppError(409, `Current step is ${project.currentStep}`, "INVALID_TRANSITION");
    }
    const claimed = this.pipeline.claimStep(projectId, step);
    if (!claimed) {
      throw new AppError(409, "Step is already running or not ready", "STEP_NOT_CLAIMED");
    }

    try {
      const fresh = assertFound(this.pipeline.findProject(projectId));
      const bookText = await readTextFile(fresh.bookPath);
      if (step === "STYLE") {
        const style = await this.textProvider.generateStyle({
          projectId,
          bookPath: fresh.bookPath,
          bookText,
          customStyle: options.customStyle,
          contextReference: fresh.geminiContextReference
        });
        if (style.contextReference) this.pipeline.setGeminiContextReference(projectId, style.contextReference);
        this.pipeline.setStyle(projectId, style.value);
      } else if (step === "CHARACTERS") {
        if (!fresh.style) throw new AppError(422, "Style must exist before characters", "MISSING_STYLE");
        const characters = await this.textProvider.generateCharacters({
          projectId,
          bookPath: fresh.bookPath,
          bookText,
          style: fresh.style,
          contextReference: fresh.geminiContextReference
        });
        if (characters.contextReference) this.pipeline.setGeminiContextReference(projectId, characters.contextReference);
        this.pipeline.replaceCharacters(projectId, characters.value.slice(0, 2));
      } else if (step === "PORTRAITS") {
        const characters = this.pipeline.listCharacters(projectId);
        if (!characters.length) throw new AppError(422, "Characters must exist before portraits", "MISSING_CHARACTERS");
        let contextReference = fresh.geminiContextReference;
        for (const [characterIndex, character] of characters.entries()) {
          const portrait = await this.imageProvider.generatePortrait({
            projectId,
            characterId: character.id,
            characterIndex,
            characterName: character.name,
            prompt: character.prompt,
            style: fresh.style,
            contextReference
          });
          this.pipeline.updateCharacterPortrait(character.id, portrait);
          if (portrait.contextReference) {
            contextReference = portrait.contextReference;
            this.pipeline.setGeminiContextReference(projectId, portrait.contextReference);
          }
        }
      } else if (step === "CHAPTERS") {
        if (!fresh.style) throw new AppError(422, "Style must exist before chapters", "MISSING_STYLE");
        const characters = this.pipeline.listCharacters(projectId);
        const chapters = await this.textProvider.generateChapters({
          projectId,
          bookPath: fresh.bookPath,
          bookText,
          style: fresh.style,
          characters,
          contextReference: fresh.geminiContextReference
        });
        if (chapters.contextReference) this.pipeline.setGeminiContextReference(projectId, chapters.contextReference);
        this.pipeline.replaceChapters(projectId, chapters.value.slice(0, 1));
      } else if (step === "ILLUSTRATIONS") {
        const chapters = this.pipeline.listChapters(projectId);
        if (!chapters.length) throw new AppError(422, "Chapters must exist before illustrations", "MISSING_CHAPTERS");
        const characters = this.pipeline.listCharacters(projectId);
        const references = await Promise.all(
          characters.map((character) => hasUsablePortraitReference(character, fresh.geminiContextReference))
        );
        if (!characters.length || references.some((hasReference) => !hasReference)) {
          throw new AppError(422, "Portrait image interaction is missing before chapter illustration generation", "MISSING_IMAGE_INTERACTION");
        }
        let contextReference = fresh.geminiContextReference;
        for (const [chapterIndex, chapter] of chapters.entries()) {
          const illustration = await this.imageProvider.generateIllustration({
            projectId,
            chapterId: chapter.id,
            chapterIndex,
            chapterName: chapter.name,
            prompt: chapter.prompt,
            contextReference
          });
          this.pipeline.updateChapterIllustration(chapter.id, illustration);
          if (illustration.contextReference) {
            contextReference = illustration.contextReference;
            this.pipeline.setGeminiContextReference(projectId, illustration.contextReference);
          }
        }
      }

      const next = nextStep(step);
      this.pipeline.markCompleted(projectId, next, next ? "IN_PROGRESS" : "DONE");
      return assertFound(this.pipeline.findProject(projectId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline step failed";
      this.pipeline.markFailed(projectId, message);
      throw error;
    }
  }

  recover(projectId: string, userId: string) {
    const project = assertFound(this.projects.findForUser(projectId, userId), "Project not found");
    if (project.stepState !== "RUNNING" || !project.stepStartedAt) {
      throw new AppError(422, "Project is not running", "NOT_RUNNING");
    }
    const staleBefore = new Date(Date.now() - this.staleAfterMs).toISOString();
    if (new Date(project.stepStartedAt).getTime() >= new Date(staleBefore).getTime()) {
      throw new AppError(422, "Running step is not stale yet", "NOT_STALE");
    }
    const recovered = this.pipeline.recoverStale(projectId, staleBefore);
    if (!recovered) throw new AppError(409, "Step could not be recovered", "RECOVERY_CONFLICT");
    return assertFound(this.pipeline.findProject(projectId));
  }
}

export async function hasUsablePortraitReference(character: CharacterModel, contextReference?: string | null) {
  const context = parseContext(contextReference);
  if (context.lastImageInteractionId) return true;
  if (character.generationState !== "COMPLETED" || !character.portraitPath) return false;
  try {
    await fs.access(character.portraitPath);
    return true;
  } catch {
    return false;
  }
}
