# Book Illustration Studio

Local-only full-stack foundation for the Gradion intern assessment.

## Prerequisites

- Node.js 22+
- npm
- A POSIX-like shell for `./start.sh` and `./test.sh`

## Environment

Copy `.env.example` to `.env` when you are ready to run with local settings.

```env
GEMINI_API_KEY=
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/app.db
STEP_STALE_AFTER_MS=120000
GEMINI_TEXT_MODEL=gemini-3.1-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-lite-image
GEMINI_SERVICE_TIER=standard
```

When `GEMINI_API_KEY` is present, the backend uses the real Gemini Interactions API for text and image generation. Without a key, it falls back to local fake/mock providers so the app remains runnable for development.

For local development, keep secrets in `backend/.env` or `.env`; never commit real keys.

If port `3000` is already in use, run the backend on another port and point Vite at it:

```bash
PORT=3001 VITE_API_PROXY_TARGET=http://localhost:3001 npm run dev
```

## Start

```bash
npm start
```

or:

```bash
./start.sh
```

This installs dependencies, runs the SQLite setup, and starts backend and frontend dev servers.

## Test

```bash
./test.sh
```

This runs backend Vitest tests and frontend Vitest tests. The command fails if either side fails.

Additional hardening checks:

```bash
npm run lint
npm run generate:api-types
npm --workspace backend run build
npm --workspace frontend run build
```

`generate:api-types` regenerates the frontend API contract from `backend/src/openapi.ts`; frontend domain types import from the generated OpenAPI schemas instead of duplicating the backend response shape by hand.

## API Docs

When the backend is running, Swagger UI is available at:

```text
http://localhost:3000/api/docs
```

If you run the backend on `3001`, use:

```text
http://localhost:3001/api/docs
```

The raw OpenAPI JSON is available at `/api/openapi.json`.

## Architecture

The app is a modular monolith:

```text
React + TanStack Query
-> REST API
-> Express modules
-> SQLite
-> local filesystem
-> Gemini service boundary
```

The backend keeps pipeline transition logic inside `PipelineService`, with atomic SQLite step claiming to prevent duplicate execution from double-clicks, refreshes, second tabs, or overlapping requests.

Entity persistence is split by concern: `PipelineRepository` owns project step state and stale recovery, while `CharacterRepository` and `ChapterRepository` own generated entities. Retrying a failed image step reuses already persisted portrait/illustration files and generates only missing items.

The frontend is feature-based: `auth`, `projects`, and `pipeline`, with service modules owning API calls and hooks owning server-state behavior.

## Gemini Image Fallback

The assessment allows mocked image responses when image-generation quota or rate limits would otherwise block review. This app therefore supports a quota-only image fallback path: `429`, `RESOURCE_EXHAUSTED`, `quota exceeded`, or `rate limit exceeded` may fall back to deterministic local mock images. Invalid API keys, malformed requests, schema errors, parsing errors, unsupported model setup, and programming errors remain visible failures.

Mock images are copied into the same `backend/data/images/<project-id>/...` folders used by real output and are persisted with `source: "mock"`. The UI can show whether an image came from `gemini` or `mock`; mock content is not claimed as Gemini-generated.

Real Gemini integration follows the notebook's required shape: upload the book through the Gemini Files API, start a book interaction, chain later text/image turns through `previous_interaction_id`, request structured JSON for characters and chapters, then generate portraits and chapter illustrations through Nano Banana image interactions.

## Current Scope

Implemented:
- Identity session using name + email.
- Project creation with persisted book text.
- SQLite schema for users, sessions, projects, characters, and chapters.
- Pipeline state machine and duplicate step claiming.
- Stale-step recovery and retryable failures.
- Server-side 2-character and 1-chapter caps.
- Item-level retry reuse for image steps, so completed portraits/illustrations are not overwritten on retry.
- Image provider boundary with quota-only mock fallback support.
- ESLint plus generated OpenAPI frontend types for API contract hardening.
- Minimal React UI structure matching the required assessment screens.
- Backend and frontend tests.

Not implemented yet:
- Multipart backend upload endpoint; the frontend reads `.txt` locally and sends text.
