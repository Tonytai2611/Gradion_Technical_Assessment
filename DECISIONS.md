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

## One more day

With one more day, I would add a small manual QA harness for the ugly paths: a debug toggle to force quota, force a provider failure, and mark a step as stale. The backend tests already cover those rules, but a reviewer-facing harness would make refresh, retry, stale recovery, and mock fallback easier to demonstrate without touching the DB or burning Gemini quota.
