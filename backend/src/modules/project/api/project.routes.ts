import { Router } from "express";
import type { ProjectController } from "../controller/project.controller.js";

export function projectRoutes(controller: ProjectController) {
  const router = Router();
  router.get("/projects", controller.list);
  router.post("/projects", controller.create);
  router.get("/projects/:projectId/images/:kind/:fileName", controller.image);
  router.get("/projects/:projectId", controller.detail);
  return router;
}
