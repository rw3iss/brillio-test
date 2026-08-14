# Brillio API Troubleshooting Runbook

_For Support Engineers · Covers common API errors and first-response checklists_

This runbook lists the ordered diagnostic steps for the most common API error
conditions. Always work the checklist top to bottom.

## HTTP 403 Forbidden — what to check first

A **403** means the API key was **recognized (authenticated) but not authorized**
for the request. This is different from a 401 (missing/invalid key). Work this
ordered checklist:

1. **API key validity** — Confirm the key exists, is active, and has **not been
   revoked or expired**. Rotated/deleted keys still authenticate the request
   format but fail authorization. (If the key is missing/invalid you'd get a
   **401**, not a 403.)
2. **Key scopes / permissions** — Verify the key has the **scope required for
   the endpoint** (e.g., `write:metrics` for `POST /metrics/events`,
   `read:metrics` for reports). A read-only key hitting a write endpoint returns
   `BR-403-SCOPE`.
3. **IP allowlist** — If the workspace has an **IP allowlist** configured
   (Brillio Shield), confirm the caller's egress IP is on the list. A blocked
   source IP returns `BR-403-IP`.
4. **Workspace / plan entitlement** — Confirm the workspace's **plan tier
   entitles** it to the feature. Example: calling an Analytics endpoint on a
   plan without the Analytics module returns `BR-403-ENTITLEMENT`.
5. **Clock skew on signed (HMAC) requests** — For HMAC-signed requests, verify
   the `X-Brillio-Timestamp` is within **300 seconds (5 minutes)** of server
   time. Excessive clock skew fails signature validation and returns
   `BR-403-SIGNATURE`. Sync the client clock (NTP).

If all five pass and the 403 persists, capture the `X-Request-Id` response
header and open a **P2** ticket.

## HTTP 401 Unauthenticated

1. Confirm the `Authorization: Bearer <key>` header is present and well-formed.
2. Confirm the key belongs to the target workspace.
3. Reissue the key if it was deleted.

## HTTP 429 Too Many Requests

1. Check the plan's rate limit (60/300/1,200/6,000 req/min by tier).
2. Honor the `Retry-After` header; add client-side backoff.
3. If sustained, consider the **Additional API Capacity** add-on (+1,000
   req/min).

## Sync / connector failures (Brillio Connect)

1. Re-auth the connector (OAuth tokens expire).
2. Check integration minimum versions (e.g., Salesforce **API v58.0** minimum).
3. Review field mapping for `BR-422-MAP` errors.

See `error-codes.md` for the full `BR-*` code reference and
`sla-and-support-policy.md` for priority/SLA targets.
