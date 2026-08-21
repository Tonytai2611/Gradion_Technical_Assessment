import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi.js";
import { appDb, type AppDb } from "./shared/db/client.js";
import { migrate } from "./shared/db/migrate.js";
import { env } from "./shared/config/env.js";
import { errorMiddleware } from "./shared/middleware/error.middleware.js";
import { requireAuth } from "./shared/middleware/auth.middleware.js";
import { AuthController } from "./modules/auth/controller/auth.controller.js";
import { authRoutes } from "./modules/auth/api/auth.routes.js";
import { AuthService } from "./modules/auth/service/auth.service.js";
import { UserRepository } from "./modules/auth/repository/user.repository.js";
import { SessionRepository } from "./modules/auth/repository/session.repository.js";
import { ChapterRepository } from "./modules/project/repository/chapter.repository.js";
import { CharacterRepository } from "./modules/project/repository/character.repository.js";
import { ProjectRepository } from "./modules/project/repository/project.repository.js";
import { ProjectService } from "./modules/project/service/project.service.js";
import { ProjectController } from "./modules/project/controller/project.controller.js";
import { projectRoutes } from "./modules/project/api/project.routes.js";
import { PipelineRepository } from "./modules/pipeline/repository/pipeline.repository.js";
import {
  FakeTextGenerationProvider,
  GeminiImageProvider,
  GeminiTextProvider,
  MockImageProvider,
  QuotaFallbackImageProvider,
  type ImageGenerationProvider,
  type TextGenerationProvider
} from "./modules/pipeline/service/gemini.service.js";
import { PipelineService } from "./modules/pipeline/service/pipeline.service.js";
import { PipelineController } from "./modules/pipeline/controller/pipeline.controller.js";
import { pipelineRoutes } from "./modules/pipeline/api/pipeline.routes.js";

export function createApp(options: {
  store?: AppDb;
  textProvider?: TextGenerationProvider;
  imageProvider?: ImageGenerationProvider;
  dataRoot?: string;
  staleAfterMs?: number;
} = {}) {
  const store = options.store ?? appDb;
  migrate(store.sqlite);

  const users = new UserRepository(store);
  const sessions = new SessionRepository(store);
  const projects = new ProjectRepository(store);
  const characters = new CharacterRepository(store);
  const chapters = new ChapterRepository(store);
  const pipelineRepo = new PipelineRepository(store);
  const dataRoot = options.dataRoot ?? path.resolve(process.cwd(), "data");

  const authService = new AuthService(users, sessions);
  const projectService = new ProjectService(projects, characters, chapters, dataRoot);
  const textProvider = options.textProvider ?? (
    env.GEMINI_API_KEY
      ? new GeminiTextProvider(env.GEMINI_API_KEY, env.GEMINI_TEXT_MODEL, env.GEMINI_SERVICE_TIER)
      : new FakeTextGenerationProvider()
  );
  const imageProvider = options.imageProvider ?? (
    env.GEMINI_API_KEY
      ? new QuotaFallbackImageProvider(
          new GeminiImageProvider(env.GEMINI_API_KEY, env.GEMINI_IMAGE_MODEL, env.GEMINI_SERVICE_TIER, dataRoot),
          new MockImageProvider(dataRoot)
        )
      : new MockImageProvider(dataRoot)
  );
  const pipelineService = new PipelineService(
    pipelineRepo,
    projects,
    characters,
    chapters,
    textProvider,
    imageProvider,
    options.staleAfterMs ?? env.STEP_STALE_AFTER_MS
  );

  const app = express();
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get("/api/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use("/api", authRoutes(new AuthController(authService)));
  app.use("/api", requireAuth(authService), projectRoutes(new ProjectController(projectService)));
  app.use("/api", requireAuth(authService), pipelineRoutes(new PipelineController(pipelineService)));
  app.use(errorMiddleware);

  return app;
}
