# Book Illustration Studio Agent Context

Build a local-only full-stack app for the Gradion intern assessment.

Stack:
- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Vitest, React Testing Library.
- Backend: Node.js, TypeScript, Express, Zod, SQLite, better-sqlite3, Drizzle ORM, Vitest, Supertest.
- Storage: SQLite for structured state; local filesystem for book text and generated images.

Core constraints:
- Pipeline order is STYLE, CHARACTERS, PORTRAITS, CHAPTERS, ILLUSTRATIONS.
- The user explicitly triggers every step.
- Duplicate execution must be prevented server-side with an atomic SQLite claim.
- Never automatically retry AI calls.
- Failed steps are retried only by the user.
- Stale RUNNING steps are recoverable after `STEP_STALE_AFTER_MS`.
- Maximum 2 characters and 1 chapter per project, enforced server-side.
- Do not implement real Gemini calls until the reference notebook has been studied.
- Image generation may use a mock provider when live Gemini image calls hit quota or rate limits.
- Do not hide invalid API keys, malformed requests, schema errors, parsing errors, or programming errors behind mocks.
- Mock image usage must remain observable through persisted `source: "mock"`.
- Do not add AWS, S3, Redis, queues, WebSockets, OAuth, microservices, or deployment.
- Prefer readable direct code over clever abstractions.

Tests are required on both backend and frontend. Backend tests should cover ordering, retry, stale recovery, caps, duplicate claiming, and ownership.
