# ALGO Auto-Mastery Runbook

This runbook defines the operational loop for keeping ALGO stable, fast, and adaptive.

## Core loops

- Continuous ingestion:
  - `/api/cron/ingest` every 10 minutes
  - `/api/cron/detect-trends` every 30 minutes
  - `/api/cron/daily-briefing` daily at 08:00
- Release quality gate:
  - `npm run verify:full`
- Daily reporting:
  - `npm run report:daily`
- Canonical scoring:
  - `src/lib/ai/canonical-viral-score.ts` is the shared scoring source used by the viral analyzer API.
- Feedback persistence:
  - `POST /api/analytics/events` stores events in Supabase `analytics_events` when env keys are available.

## Local operator commands

- Validate release readiness:
  - `npm run verify:full`
- Generate operational summary:
  - `npm run report:daily`
- Analyze autopilot patterns:
  - `npm run autopilot:analyze`

## Output artifacts

- `reports/performance-budget.json`
- `reports/daily-system-report.json`
- `reports/daily-system-report.md`
- `reports/adaptive-weights-history.json`

## Model monitoring

- API endpoint:
  - `GET /api/model/weights`
- Optional simulation query:
  - `/api/model/weights?engagementRate=0.2&frictionRate=0.06`
- Status page now displays model telemetry and rollback state.

## Intelligence Hub APIs

- Global omniscient snapshot:
  - `GET /api/intelligence/global?region=FR&locale=fr`
- Predictive behavioral/virality analysis:
  - `GET /api/intelligence/predictive?region=FR&locale=fr`
- Product opportunity radar (dropshipping-oriented signals):
  - `GET /api/intelligence/products?region=FR&locale=fr`
- Decision logs storage/ops:
  - `POST /api/intelligence/decision-log` (ingest decision feed snapshots)
  - `GET /api/intelligence/decision-log` (operator-protected)
  - `DELETE /api/intelligence/decision-log` (operator-protected purge)
  - `GET /api/intelligence/decision-log?format=csv` (server-signed CSV export with `X-Intelligence-Integrity-Sha256`)

These endpoints aggregate:
- public data signals (news/trends/video/finance proxy),
- first-party private signals (engagement/friction from site analytics),
- anomaly/opportunity detection and actionable recommendations.

## Production guardrails

- Cron routes are fail-closed when `CRON_SECRET` is missing.
- API defaults to `private, no-store` unless a route explicitly sets public caching.
- PR checks run a strict release gate workflow.
- Intelligence logs are protected by `INTELLIGENCE_DASHBOARD_TOKEN`.
- `/intelligence/logs` route is middleware-protected and can bootstrap auth with `?opsToken=<token>` (sets secure httpOnly cookie).
- Decision-log memory retention is time-windowed (48h) plus bounded capacity, with integrity hash returned on JSON/CSV exports.

## Next hardening priorities

- Replace in-memory rate limiting with distributed storage.
- Persist analytics/monitoring events to durable storage.
- Consolidate scoring engines into a single canonical ranking pipeline.
