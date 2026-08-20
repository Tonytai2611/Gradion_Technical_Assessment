# Architecture and Foundation Prompt

This prompt artifact records the active AI-copilot constraints used for the scaffold and provider-boundary work.

- Build a local-only Gradion take-home assessment app.
- Keep a modular monolith, not microservices.
- Use React, TypeScript, Vite, Tailwind, React Router, TanStack Query, Vitest, and React Testing Library on the frontend.
- Use Node.js, TypeScript, Express, Zod, SQLite, better-sqlite3, Drizzle ORM, Vitest, and Supertest on the backend.
- Store structured state in SQLite and book/images on the local filesystem.
- Enforce pipeline order server-side: STYLE, CHARACTERS, PORTRAITS, CHAPTERS, ILLUSTRATIONS.
- Use atomic SQLite step claiming to prevent duplicate Gemini calls.
- Do not automatically retry Gemini calls.
- Failed steps must be user-retryable.
- Stale RUNNING steps must be explicitly recoverable.
- Enforce maximum 2 adult characters and maximum 1 chapter server-side.
- Do not implement real Gemini request formats until the reference notebook has been studied.
- Image generation may fall back to mock output only for quota/rate-limit errors.
- Invalid credentials, malformed requests, schema errors, parsing errors, unsupported model configuration, and programming errors must remain visible failures.
- Mock images must use the same filesystem/SQLite path as real generated outputs and persist `source: "mock"`.
- Do not fabricate `DECISIONS.md` entries or test results.