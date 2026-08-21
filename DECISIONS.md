# Decisions

This file records engineering decisions, not a time log. Each entry names the trade-off and, where relevant, where AI output or an earlier implementation had to be corrected.

## SQLite plus filesystem instead of a heavier backend

Codex initially sketched a modular full-stack app, and I kept the local-only shape but chose SQLite for state and the filesystem for book text and images. SQLite gives transactions and an atomic step claim without adding Redis, queues, or a hosted database. The cost is that image files and DB rows must stay in sync, so project image paths are always served through the backend instead of exposing raw filesystem paths.

## Split project status from step state

AI suggestions tended to collapse progress into a single status. I pushed that apart into `status`, `current_step`, and `step_state` because refresh and restart behavior need to express "this project is on Portraits and that step is RUNNING/FAILED/READY." The cost is more state transitions to test, but it makes duplicate prevention and stale recovery explicit.

## Server-side atomic step claims

The demo app can disable a button in one browser tab, but that is not enough for double-clicks, refreshes, or a second tab. I put the guard in SQLite: each run attempts one atomic update from READY/FAILED to RUNNING before any provider call. If the claim fails, no Gemini call happens. The cost is that the UI has to tolerate conflict responses and refetch current state instead of assuming every click starts work.

## Polling and stale recovery instead of queues or sockets

AI output tends to reach for background jobs, queues, WebSockets, and automatic retry loops for long-running AI calls. I rejected that for this assessment. A user-triggered HTTP call marks the step RUNNING, the frontend polls project detail while it is running, and a stale RUNNING step can be explicitly recovered after a timeout. The cost is that per-item updates are coarse and tied to the HTTP request lifetime, but the implementation stays local, debuggable, and aligned with the "no auto-retry" requirement.

## Notebook-shaped Gemini interactions

The notebook uses the Gemini Files API, Interactions API, structured JSON output, and `previous_interaction_id` to avoid resending the book every step. I updated the provider boundary to preserve that shape instead of sending raw book text repeatedly. I chose `gemini-3.1-flash-lite` for text because this assessment favors bounded cost and simple structured extraction over maximum reasoning depth, and `gemini-3.1-flash-lite-image` for Nano Banana image generation because it is the image family's lower-cost lite option. Both are overrideable through env vars. Cost: the prompts may need to stay tighter than they would with a larger text model, and `gemini_context_reference` is stored as a JSON blob rather than separate normalized columns.

## Quota-only mock image fallback

The assessment allows mocked image responses when live image generation runs into free-tier quota or rate limits. I kept real Gemini image generation as the preferred path, but added a provider boundary and fallback wrapper so only clearly identified quota/rate-limit errors can use deterministic mock images. I corrected an earlier placeholder SVG implementation because it looked too technical and did not prove the real image serving path; the mock provider now copies real PNG assets into the same project output folders as Gemini images. Invalid credentials, malformed requests, parsing mistakes, and programming errors still fail visibly.

## Item-level retry reuse

A failed step should not erase good work from the same step. I split character and chapter persistence out of the pipeline repository, then changed image retries to skip any completed item whose file still exists on disk. If Portraits fails after character one succeeds, retrying Portraits generates only character two. That keeps the user-triggered retry rule while avoiding the reviewer feedback problem where retrying means regenerating everything.

## OpenAPI-generated frontend contract

The first frontend types were handwritten, which was easy to read but weak as an API contract. I kept the simple REST client, but now generate TypeScript schemas from `backend/src/openapi.ts` with `npm run generate:api-types`. Frontend feature types import from that generated file, so missing fields such as `bookPath` or `updatedAt` are caught during `npm --workspace frontend run build`.

## AI overrides

These are the places where I had to push back on AI output or correct an AI-assisted implementation:

- Codex first treated button disabling and frontend pending state as the main duplicate-call guard. That felt unsafe: double-clicks are only one case, and a second tab or refresh can still race the backend. I moved the real guard into SQLite with an atomic claim before any Gemini call.
- For long-running AI work, the suggestions kept drifting toward queues, background workers, WebSockets, and automatic retry loops. Those are reasonable tools in a larger product, but they were too much for this local assessment and would also blur the "user retries only" rule. I kept it to user-triggered HTTP calls, polling while a step is RUNNING, and explicit stale recovery.
- The first mock image version copied generated SVG placeholders with large labels like `MOCK PORTRAIT`. It technically worked, but it made the UI look unfinished and did not prove that real image files would be served correctly. I replaced it with deterministic PNG assets copied into the same project image folders used by real Gemini output, with `source: "mock"` still persisted for honesty.
- I also caught a text fallback that was too helpful in the wrong way: when Gemini text quota failed, it returned the fake style `Warm watercolor storybook style with soft ink outlines.` That could make a reviewer think Gemini had produced the style. I removed text fallback when an API key is configured; text steps now either call Gemini or fail visibly so the user can retry.

## One more day

With one more day, I would add a small manual QA harness for the ugly paths: a debug toggle to force quota, force a provider failure, and mark a step as stale. The backend tests already cover those rules, but a reviewer-facing harness would make refresh, retry, stale recovery, and mock fallback easier to demonstrate without touching the DB or burning Gemini quota.
