import type { RequestHandler } from "express";
import { z } from "zod";
import type { PipelineService } from "../service/pipeline.service.js";
import { stepSlugMap } from "../type/pipeline.types.js";

const runBodySchema = z.object({
  customStyle: z.string().trim().optional()
});

export class PipelineController {
  constructor(private readonly pipeline: PipelineService) {}

  run: RequestHandler = async (req, res, next) => {
    try {
      const stepParam = String(req.params.step);
      const projectId = String(req.params.projectId);
      const step = stepSlugMap[stepParam as keyof typeof stepSlugMap];
      if (!step) {
        res.status(400).json({ error: "Invalid step" });
        return;
      }
      const body = runBodySchema.parse(req.body ?? {});
      const project = await this.pipeline.runStep(projectId, req.user!.id, step, body);
      res.json({ project });
    } catch (error) {
      next(error);
    }
  };

  recover: RequestHandler = (req, res, next) => {
    try {
      const stepParam = String(req.params.step);
      const projectId = String(req.params.projectId);
      const step = stepSlugMap[stepParam as keyof typeof stepSlugMap];
      if (!step) {
        res.status(400).json({ error: "Invalid step" });
        return;
      }
      const project = this.pipeline.recover(projectId, req.user!.id);
      res.json({ project });
    } catch (error) {
      next(error);
    }
  };
}
