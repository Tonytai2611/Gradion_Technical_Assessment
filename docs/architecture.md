# Architecture

The app is a local modular monolith:

```text
React
-> REST
-> Express
-> SQLite
-> local filesystem
-> Gemini text provider / image provider
```

SQLite is the right-sized persistence layer for this assessment: it gives durable state, unique constraints, transactions, and atomic step claiming without adding a separate database service. Book text and generated images live on disk because the assessment is local-only and explicitly excludes cloud storage.

There is no AWS, S3, Redis, queue, OAuth, or deployment layer. Those would increase setup cost without helping the required local workflow.

The frontend polls project detail while a step is RUNNING. WebSockets or SSE would be useful for richer real-time updates, but polling is simpler and sufficient for the first implementation.

Duplicate execution is handled on the backend, not by disabled buttons. The pipeline service atomically claims a step with SQLite before calling the Gemini boundary. If a second request cannot claim the row, it returns the current state and performs no external work.

Persistence is split by ownership. `PipelineRepository` only owns project-level pipeline state such as claim, completion, failure, Gemini context reference, and stale recovery. Generated entities live behind `CharacterRepository` and `ChapterRepository`, which keeps data storage separate from the orchestration layer.

Retries are idempotent at the item level for image steps. If portrait generation fails after one character already has a completed persisted image, retrying Portraits skips that character and generates only the missing portrait. The same pattern is used for chapter illustrations.

Image generation is behind a provider boundary. The live Gemini image provider follows the notebook interaction chain when quota is available. A quota fallback wrapper may catch only quota/rate-limit failures and delegate to the mock image provider, which copies deterministic PNG sample images into the same project image folders and persists `source: "mock"`.

The Gemini providers follow the notebook's interaction chain. The book is uploaded through the Files API, the first interaction stores the document context, subsequent style/character/chapter calls use `previous_interaction_id`, and structured JSON responses are requested for prompt lists. The interaction ids and file URI are stored in `projects.gemini_context_reference` as JSON.

The API contract is published as OpenAPI at `/api/openapi.json` and `/api/docs`. Frontend response types are generated from `backend/src/openapi.ts` with `npm run generate:api-types`, so TypeScript catches drift between backend DTOs and frontend assumptions.
