# Build Plan

1. Scaffold the monorepo, scripts, docs, and local data folders.
2. Create the SQLite schema and reusable pipeline state machine.
3. Write backend tests for ordering, retry, duplicate claims, stale recovery, caps, and ownership.
4. Add the small REST API around session, projects, and pipeline actions.
5. Build the minimal React UI structure around identity, project list, new project, and project detail.
6. Add high-value frontend tests for empty, loading, error, stale, and completed states.
7. Study the Gemini notebook before designing real request formats.
8. Implement real Gemini service methods behind the existing service boundary.
9. Run UAT on refresh, second tab, retry, stale recovery, live Gemini calls, quota fallback, and visual polish.

Image provider fallback wraps the live Gemini image provider: quota/rate-limit errors can fall back to deterministic mock PNG files, while non-quota errors remain visible failures.
