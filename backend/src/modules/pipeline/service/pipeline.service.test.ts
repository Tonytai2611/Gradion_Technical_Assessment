import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb, type AppDb } from "../../../shared/db/client.js";
import { migrate } from "../../../shared/db/migrate.js";
import { UserRepository } from "../../auth/repository/user.repository.js";
import { ProjectRepository } from "../../project/repository/project.repository.js";
import { CharacterRepository } from "../../project/repository/character.repository.js";
import { ChapterRepository } from "../../project/repository/chapter.repository.js";
import { ProjectService } from "../../project/service/project.service.js";
import { PipelineRepository } from "../repository/pipeline.repository.js";
import { PipelineService } from "./pipeline.service.js";
import {
  MockImageProvider,
  QuotaFallbackImageProvider,
  type GeneratedImage,
  type ImageGenerationProvider,
  type TextGenerationProvider
} from "./gemini.service.js";
import { createApp } from "../../../app.js";

class TestTextProvider implements TextGenerationProvider {
  shouldFailStyle = false;
  shouldFailCharacters = false;

  async generateStyle() {
    if (this.shouldFailStyle) throw new Error("Style failed");
    return { value: "Test watercolor style", contextReference: JSON.stringify({ styleInteractionId: "style-1" }) };
  }

  async generateCharacters() {
    if (this.shouldFailCharacters) throw new Error("Characters failed");
    return {
      value: [
        { name: "Adult One", prompt: "Prompt one" },
        { name: "Adult Two", prompt: "Prompt two" },
        { name: "Adult Three", prompt: "Must be capped" }
      ],
      contextReference: JSON.stringify({ styleInteractionId: "style-1", charactersInteractionId: "characters-1" })
    };
  }

  async generatePortrait() {
    return null;
  }

  async generateChapters() {
    return {
      value: [
        { name: "Chapter One", prompt: "Prompt one" },
        { name: "Chapter Two", prompt: "Must be capped" }
      ],
      contextReference: JSON.stringify({ styleInteractionId: "style-1", charactersInteractionId: "characters-1", chaptersInteractionId: "chapters-1" })
    };
  }
}

class TestImageProvider implements ImageGenerationProvider {
  async generatePortrait(input: { projectId: string; characterId: string }): Promise<GeneratedImage> {
    return {
      filePath: `test://${input.projectId}/characters/${input.characterId}.png`,
      mimeType: "image/png",
      source: "gemini"
    };
  }

  async generateIllustration(input: { projectId: string; chapterId: string }): Promise<GeneratedImage> {
    return {
      filePath: `test://${input.projectId}/chapters/${input.chapterId}.png`,
      mimeType: "image/png",
      source: "gemini"
    };
  }
}

class ThrowingImageProvider implements ImageGenerationProvider {
  constructor(private readonly error: Error & { status?: number; code?: string }) {}

  async generatePortrait(): Promise<GeneratedImage> {
    throw this.error;
  }

  async generateIllustration(): Promise<GeneratedImage> {
    throw this.error;
  }
}

class FailAfterFirstPortraitProvider implements ImageGenerationProvider {
  portraitCalls = 0;

  constructor(private readonly dataRoot: string) {}

  async generatePortrait(input: { projectId: string; characterId: string }): Promise<GeneratedImage> {
    this.portraitCalls += 1;
    if (this.portraitCalls > 1) throw new Error("Second portrait failed");
    const targetDir = path.join(this.dataRoot, "images", input.projectId, "characters");
    const targetPath = path.join(targetDir, `${input.characterId}.png`);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, `portrait-${input.characterId}`);
    return { filePath: targetPath, mimeType: "image/png", source: "gemini" };
  }

  async generateIllustration(): Promise<GeneratedImage> {
    throw new Error("Not used");
  }
}

class CountingImageProvider implements ImageGenerationProvider {
  portraitCalls = 0;

  constructor(private readonly dataRoot: string) {}

  async generatePortrait(input: { projectId: string; characterId: string }): Promise<GeneratedImage> {
    this.portraitCalls += 1;
    const targetDir = path.join(this.dataRoot, "images", input.projectId, "characters");
    const targetPath = path.join(targetDir, `${input.characterId}-retry.png`);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, `retry-portrait-${input.characterId}`);
    return { filePath: targetPath, mimeType: "image/png", source: "gemini" };
  }

  async generateIllustration(input: { projectId: string; chapterId: string }): Promise<GeneratedImage> {
    const targetDir = path.join(this.dataRoot, "images", input.projectId, "chapters");
    const targetPath = path.join(targetDir, `${input.chapterId}.png`);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetPath, `illustration-${input.chapterId}`);
    return { filePath: targetPath, mimeType: "image/png", source: "gemini" };
  }
}

describe("PipelineService", () => {
  let store: AppDb;
  let dataRoot: string;
  let users: UserRepository;
  let projectsRepo: ProjectRepository;
  let characterRepo: CharacterRepository;
  let chapterRepo: ChapterRepository;
  let projects: ProjectService;
  let pipelineRepo: PipelineRepository;
  let textProvider: TestTextProvider;
  let imageProvider: TestImageProvider;
  let pipeline: PipelineService;
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), "bis-test-"));
    store = createDb(":memory:");
    migrate(store.sqlite);
    users = new UserRepository(store);
    projectsRepo = new ProjectRepository(store);
    characterRepo = new CharacterRepository(store);
    chapterRepo = new ChapterRepository(store);
    projects = new ProjectService(store, projectsRepo, characterRepo, chapterRepo, dataRoot);
    pipelineRepo = new PipelineRepository(store);
    textProvider = new TestTextProvider();
    imageProvider = new TestImageProvider();
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, imageProvider, 1000);

    userId = users.upsertByEmail({ name: "Test User", email: "test@example.com" }).id;
    const project = await projects.create(userId, { title: "Wind", bookText: "A riverbank story with adult animals." });
    projectId = project.id;
  });

  afterEach(async () => {
    store.sqlite.close();
    await fs.rm(dataRoot, { recursive: true, force: true });
  });

  it("allows STYLE to run first", async () => {
    const project = await pipeline.runStep(projectId, userId, "STYLE");

    expect(project.currentStep).toBe("CHARACTERS");
    expect(project.stepState).toBe("READY");
    expect(project.status).toBe("IN_PROGRESS");
    expect(pipelineRepo.findProject(projectId)?.style).toBe("Test watercolor style");
  });

  it("rejects CHARACTERS before STYLE completes", async () => {
    await expect(pipeline.runStep(projectId, userId, "CHARACTERS")).rejects.toThrow("Current step is STYLE");
  });

  it("rejects PORTRAITS before CHARACTERS completes", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");

    await expect(pipeline.runStep(projectId, userId, "PORTRAITS")).rejects.toThrow("Current step is CHARACTERS");
  });

  it("does not allow two overlapping attempts to claim the same step", () => {
    const first = pipelineRepo.claimStep(projectId, "STYLE");
    const second = pipelineRepo.claimStep(projectId, "STYLE");

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("allows a failed step to be retried", async () => {
    textProvider.shouldFailStyle = true;
    await expect(pipeline.runStep(projectId, userId, "STYLE")).rejects.toThrow("Style failed");
    expect(pipelineRepo.findProject(projectId)?.stepState).toBe("FAILED");

    textProvider.shouldFailStyle = false;
    const project = await pipeline.runStep(projectId, userId, "STYLE");

    expect(project.currentStep).toBe("CHARACTERS");
    expect(project.stepState).toBe("READY");
  });

  it("retrying a failed step keeps completed earlier results", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    textProvider.shouldFailCharacters = true;

    await expect(pipeline.runStep(projectId, userId, "CHARACTERS")).rejects.toThrow("Characters failed");
    expect(pipelineRepo.findProject(projectId)?.style).toBe("Test watercolor style");
  });

  it("recovers a stale RUNNING step", () => {
    const startedAt = new Date(Date.now() - 5000).toISOString();
    pipelineRepo.setStepStateForTest(projectId, "RUNNING", startedAt);

    const project = pipeline.recover(projectId, userId);

    expect(project.stepState).toBe("FAILED");
    expect(project.lastError).toContain("interrupted");
  });

  it("rejects recovery for a non-stale RUNNING step", () => {
    pipelineRepo.setStepStateForTest(projectId, "RUNNING", new Date().toISOString());

    expect(() => pipeline.recover(projectId, userId)).toThrow("not stale");
  });

  it("caps character results at 2 server-side", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");

    expect(characterRepo.listForProject(projectId)).toHaveLength(2);
  });

  it("caps chapter results at 1 server-side", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    await pipeline.runStep(projectId, userId, "PORTRAITS");
    await pipeline.runStep(projectId, userId, "CHAPTERS");

    expect(chapterRepo.listForProject(projectId)).toHaveLength(1);
  });

  it("falls back to mock images only for quota or rate-limit errors", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    const quotaError = Object.assign(new Error("quota exceeded"), { status: 429, code: "RESOURCE_EXHAUSTED" });
    const fallbackImageProvider = new QuotaFallbackImageProvider(
      new ThrowingImageProvider(quotaError),
      new MockImageProvider(dataRoot),
      { warn: () => undefined }
    );
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, fallbackImageProvider, 1000);

    await pipeline.runStep(projectId, userId, "PORTRAITS");
    const characters = characterRepo.listForProject(projectId);

    expect(characters).toHaveLength(2);
    expect(characters.every((character) => character.generationState === "COMPLETED")).toBe(true);
    expect(characters.every((character) => character.portraitSource === "mock")).toBe(true);
    expect(characters.every((character) => character.portraitMimeType === "image/png")).toBe(true);
    expect(characters.every((character) => character.portraitPath?.endsWith(".png"))).toBe(true);
    await expect(fs.access(characters[0].portraitPath!)).resolves.toBeUndefined();
    await expect(fs.readFile(characters[0].portraitPath!)).resolves.toEqual(
      await fs.readFile(path.resolve(process.cwd(), "assets", "mock", "portrait-1.png"))
    );
    await expect(fs.readFile(characters[1].portraitPath!)).resolves.toEqual(
      await fs.readFile(path.resolve(process.cwd(), "assets", "mock", "portrait-2.png"))
    );
  });

  it("does not fallback to mock images for invalid Gemini credentials", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    const authError = Object.assign(new Error("invalid api key"), { status: 401, code: "UNAUTHENTICATED" });
    const fallbackImageProvider = new QuotaFallbackImageProvider(
      new ThrowingImageProvider(authError),
      new MockImageProvider(dataRoot),
      { warn: () => undefined }
    );
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, fallbackImageProvider, 1000);

    await expect(pipeline.runStep(projectId, userId, "PORTRAITS")).rejects.toThrow("invalid api key");
    expect(pipelineRepo.findProject(projectId)?.stepState).toBe("FAILED");
    expect(characterRepo.listForProject(projectId).every((character) => character.portraitSource === null)).toBe(true);
  });

  it("retrying portraits reuses completed portraits and only generates missing items", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    const failingProvider = new FailAfterFirstPortraitProvider(dataRoot);
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, failingProvider, 1000);

    await expect(pipeline.runStep(projectId, userId, "PORTRAITS")).rejects.toThrow("Second portrait failed");
    const afterFailure = characterRepo.listForProject(projectId);
    const completedPortrait = afterFailure.find((character) => character.generationState === "COMPLETED")!;
    const originalPortraitPath = completedPortrait.portraitPath;

    const retryProvider = new CountingImageProvider(dataRoot);
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, retryProvider, 1000);
    await pipeline.runStep(projectId, userId, "PORTRAITS");
    const afterRetry = characterRepo.listForProject(projectId);

    expect(retryProvider.portraitCalls).toBe(1);
    expect(afterRetry.every((character) => character.generationState === "COMPLETED")).toBe(true);
    expect(afterRetry.find((character) => character.id === completedPortrait.id)?.portraitPath).toBe(originalPortraitPath);
  });

  it("illustration fails if a character has no portrait reference at all", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    await pipeline.runStep(projectId, userId, "PORTRAITS");
    await pipeline.runStep(projectId, userId, "CHAPTERS");
    store.sqlite.prepare(`
      UPDATE characters
      SET portrait_path = NULL, portrait_mime_type = NULL, portrait_source = NULL, generation_state = 'PENDING'
      WHERE project_id = ?
    `).run(projectId);

    await expect(pipeline.runStep(projectId, userId, "ILLUSTRATIONS")).rejects.toThrow("Portrait image interaction is missing");
    expect(pipelineRepo.findProject(projectId)?.stepState).toBe("FAILED");
  });

  it("illustration proceeds when mock portraits have valid local paths", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    const quotaError = Object.assign(new Error("quota exceeded"), { status: 429, code: "RESOURCE_EXHAUSTED" });
    pipeline = new PipelineService(
      pipelineRepo,
      projectsRepo,
      characterRepo,
      chapterRepo,
      textProvider,
      new QuotaFallbackImageProvider(
        new ThrowingImageProvider(quotaError),
        new MockImageProvider(dataRoot),
        { warn: () => undefined }
      ),
      1000
    );
    await pipeline.runStep(projectId, userId, "PORTRAITS");
    await pipeline.runStep(projectId, userId, "CHAPTERS");

    const missingInteractionError = Object.assign(
      new Error("Portrait image interaction is missing before chapter illustration generation"),
      { status: 422, code: "MISSING_IMAGE_INTERACTION" }
    );
    const fallbackImageProvider = new QuotaFallbackImageProvider(
      new ThrowingImageProvider(missingInteractionError),
      new MockImageProvider(dataRoot),
      { warn: () => undefined }
    );
    pipeline = new PipelineService(pipelineRepo, projectsRepo, characterRepo, chapterRepo, textProvider, fallbackImageProvider, 1000);

    const project = await pipeline.runStep(projectId, userId, "ILLUSTRATIONS");
    const chapters = chapterRepo.listForProject(projectId);

    expect(project.status).toBe("DONE");
    expect(chapters[0].illustrationSource).toBe("mock");
    expect(chapters[0].illustrationMimeType).toBe("image/png");
    expect(chapters[0].illustrationPath?.endsWith(".png")).toBe(true);
    await expect(fs.access(chapters[0].illustrationPath!)).resolves.toBeUndefined();
    await expect(fs.readFile(chapters[0].illustrationPath!)).resolves.toEqual(
      await fs.readFile(path.resolve(process.cwd(), "assets", "mock", "illustration-1.png"))
    );
  });

  it("illustration proceeds when live portraits have a Gemini image interaction id", async () => {
    await pipeline.runStep(projectId, userId, "STYLE");
    await pipeline.runStep(projectId, userId, "CHARACTERS");
    await pipeline.runStep(projectId, userId, "PORTRAITS");
    await pipeline.runStep(projectId, userId, "CHAPTERS");
    pipelineRepo.setGeminiContextReference(projectId, JSON.stringify({ lastImageInteractionId: "gemini-image-interaction-1" }));

    const project = await pipeline.runStep(projectId, userId, "ILLUSTRATIONS");

    expect(project.status).toBe("DONE");
    expect(chapterRepo.listForProject(projectId)[0].illustrationSource).toBe("gemini");
  });

  it("prevents a user from accessing another user's project", async () => {
    const app = createApp({ store, textProvider, imageProvider, dataRoot, staleAfterMs: 1000 });
    const owner = request.agent(app);
    const stranger = request.agent(app);

    await owner.post("/api/session").send({ name: "Owner", email: "owner@example.com" }).expect(201);
    const created = await owner.post("/api/projects").send({ title: "Private", bookText: "secret book text" }).expect(201);
    await stranger.post("/api/session").send({ name: "Stranger", email: "stranger@example.com" }).expect(201);

    await stranger.get(`/api/projects/${created.body.project.id}`).expect(404);
  });
});
