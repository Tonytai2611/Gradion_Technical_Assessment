# Testing Strategy

## Backend

The backend tests focus on pipeline correctness: step ordering, atomic claims, retry, stale recovery, result caps, project ownership, and quota-only image fallback.

## Frontend

The frontend tests focus on high-value user-visible states: empty projects, progress/status rendering, exact running step, failed retry, stale recovery, and completed character rendering.

## Deliberately not tested

Automated tests do not call live Gemini APIs. Text and image generation are provider boundaries, so tests use fake/mock implementations to avoid quota usage and flaky network failures. Live Gemini behavior should be checked manually with a local `.env` key.

## Test Run Results

Command run:

```bash
npm test
```

Result:

```text
Backend: 1 test file passed, 16 tests passed.
Frontend: 3 test files passed, 7 tests passed.
```

Build checks also passed:

```bash
npm --workspace backend run build
npm --workspace frontend run build
```
