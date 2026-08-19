import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_PATH: z.string().default("./data/app.db"),
  STEP_STALE_AFTER_MS: z.coerce.number().default(120000),
  GEMINI_TEXT_MODEL: z.string().default("gemini-3.1-flash-lite"),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-3.1-flash-lite-image"),
  GEMINI_SERVICE_TIER: z.enum(["flex", "standard", "priority"]).default("standard"),
  GEMINI_API_KEY: z.string().optional()
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  DATABASE_PATH: path.resolve(process.cwd(), parsed.DATABASE_PATH)
};
