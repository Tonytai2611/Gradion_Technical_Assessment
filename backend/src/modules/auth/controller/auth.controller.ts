import type { RequestHandler } from "express";
import { z } from "zod";
import type { AuthService } from "../service/auth.service.js";

const sessionSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email()
});

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  createSession: RequestHandler = (req, res, next) => {
    try {
      const input = sessionSchema.parse(req.body);
      const { user, session } = this.auth.signIn(input);
      res.cookie("sid", session.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: false
      });
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  getSession: RequestHandler = (req, res) => {
    const session = this.auth.getSession(req.cookies?.sid);
    res.json({ user: session?.user ?? null });
  };

  deleteSession: RequestHandler = (req, res) => {
    this.auth.signOut(req.cookies?.sid);
    res.clearCookie("sid");
    res.status(204).send();
  };
}
