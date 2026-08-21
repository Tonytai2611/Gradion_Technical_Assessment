# Testing Strategy

## Backend

The backend tests focus on pipeline correctness: step ordering, atomic claims, retry, item-level image reuse, stale recovery, result caps, project ownership, and quota-only image fallback.

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
Backend: 1 test file passed, 17 tests passed.
Frontend: 3 test files passed, 7 tests passed.
```

Hardening and build checks also passed:

```bash
npm run lint
npm run generate:api-types
npm --workspace backend run build
npm --workspace frontend run build
npm audit
```

`npm audit` currently reports 0 known vulnerabilities.
