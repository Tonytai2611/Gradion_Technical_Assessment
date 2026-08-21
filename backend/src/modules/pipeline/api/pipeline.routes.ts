import { Router } from "express";
import type { PipelineController } from "../controller/pipeline.controller.js";

export function pipelineRoutes(controller: PipelineController) {
  const router = Router();
  router.post("/projects/:projectId/steps/:step/run", controller.run);
  router.post("/projects/:projectId/steps/:step/recover", controller.recover);
  return router;
}
