import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid request", details: error.flatten() });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }
  const message = process.env.NODE_ENV === "production" ? "Unexpected error" : error?.message || "Unexpected error";
  res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
};
