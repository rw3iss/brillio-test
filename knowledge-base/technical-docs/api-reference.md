# Brillio REST API Reference

_API version: v2 · Base URL: `https://api.brillio.example/v2` · Core 7.4_

The Brillio API is a JSON-over-HTTPS REST API. All requests must be
authenticated and served over TLS 1.2+.

## Authentication

Brillio supports two auth methods:

1. **API key (bearer token)** — send `Authorization: Bearer <API_KEY>`.
   Keys are scoped to a workspace and carry a set of permission scopes.
2. **Signed requests (HMAC)** — for server-to-server integrations, requests may
   be signed with an HMAC-SHA256 signature. Signed requests include an
   `X-Brillio-Timestamp` header; the server rejects timestamps that differ from
   server time by more than **300 seconds (5 minutes)** to prevent replay.

> API keys are created in **Settings → API Keys**. Never embed keys in client
> code. Rotate keys at least every 90 days.

### Key scopes

| Scope            | Grants                                      |
|------------------|---------------------------------------------|
| `read:metrics`   | Read analytics metrics and reports          |
| `write:metrics`  | Push custom metric events                    |
| `read:projects`  | Read workspaces and projects                 |
| `write:projects` | Create/update projects                       |
| `admin`          | Full workspace administration                |

## Rate limits

Rate limits are enforced per API key, per minute, and depend on plan tier:

| Tier       | Limit (req/min) |
|------------|-----------------|
| Starter    | 60              |
| Team       | 300             |
| Pro        | 1,200           |
| Enterprise | 6,000           |

When exceeded, the API returns **HTTP 429** with a `Retry-After` header.

## Common HTTP status codes

| Status | Meaning                                                                 |
|--------|-------------------------------------------------------------------------|
| 200    | OK                                                                       |
| 201    | Created                                                                  |
| 400    | Bad request (malformed JSON or params) — see error code `BR-400-*`      |
| 401    | Unauthenticated — missing/invalid API key — error code `BR-401-AUTH`    |
| 403    | Forbidden — key valid but not permitted — error code `BR-403-SCOPE` etc.|
| 404    | Not found                                                                |
| 429    | Rate limited — error code `BR-429-RATE`                                  |
| 5xx    | Server error                                                             |

A **403** specifically means the API key was recognized but is **not authorized**
for the action. See `support-sla/troubleshooting-runbook.md` for the ordered
403 checklist, and `error-codes.md` for the full code list.

## Core endpoints

### `GET /projects`
List projects in the workspace. Requires `read:projects`.

### `POST /metrics/events`
Push a custom metric event. Requires `write:metrics`.

```
POST /v2/metrics/events
Authorization: Bearer <API_KEY>
Content-Type: application/json

{ "metric": "orders.completed", "value": 1, "timestamp": "2024-11-05T10:00:00Z" }
```

### `GET /reports/{id}`
Fetch a rendered report. Requires `read:metrics`.

## Versioning

The API is versioned in the URL path (`/v2`). Breaking changes ship under a new
path prefix. Non-breaking additions ship within the current version. Deprecated
versions receive **12 months** of notice before sunset. See `release-notes.md`.
