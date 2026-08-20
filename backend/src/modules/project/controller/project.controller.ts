import type { RequestHandler } from "express";
import { z } from "zod";
import type { ProjectService } from "../service/project.service.js";

const createProjectSchema = z.object({
  title: z.string().trim().min(1),
  bookText: z.string().trim().min(1)
});

export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  list: RequestHandler = (req, res, next) => {
    try {
      res.json({ projects: this.projects.list(req.user!.id) });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      const input = createProjectSchema.parse(req.body);
      const project = await this.projects.create(req.user!.id, input);
      res.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  };

  detail: RequestHandler = async (req, res, next) => {
    try {
      const projectId = String(req.params.projectId);
      const project = await this.projects.detail(projectId, req.user!.id);
      res.json({ project });
    } catch (error) {
      next(error);
    }
  };

  image: RequestHandler = (req, res, next) => {
    try {
      const kind = req.params.kind === "characters" || req.params.kind === "chapters" ? req.params.kind : null;
      if (!kind) {
        res.status(400).json({ error: "Invalid image kind" });
        return;
      }
      const imagePath = this.projects.getImageFile(String(req.params.projectId), req.user!.id, kind, String(req.params.fileName));
      res.sendFile(imagePath);
    } catch (error) {
      next(error);
    }
  };
}
