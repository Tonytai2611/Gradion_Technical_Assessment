import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import type { AuthService } from "../../modules/auth/service/auth.service.js";
import type { UserModel } from "../../modules/auth/type/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}

export function requireAuth(auth: AuthService): RequestHandler {
  return (req, _res, next) => {
    const session = auth.getSession(req.cookies?.sid);
    if (!session) return next(new AppError(401, "No active session", "UNAUTHENTICATED"));
    req.user = session.user;
    next();
  };
}
