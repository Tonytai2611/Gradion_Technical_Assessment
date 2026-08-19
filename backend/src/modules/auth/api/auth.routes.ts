import { Router } from "express";
import type { AuthController } from "../controller/auth.controller.js";

export function authRoutes(controller: AuthController) {
  const router = Router();
  router.post("/session", controller.createSession);
  router.get("/session", controller.getSession);
  router.delete("/session", controller.deleteSession);
  return router;
}
