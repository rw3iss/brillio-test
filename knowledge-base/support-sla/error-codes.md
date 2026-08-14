# Brillio Error Code Reference

_All Brillio API errors return a JSON body with a `code`, `message`, and
`requestId`. Codes follow the pattern `BR-<httpStatus>-<slug>`._

```json
{
  "code": "BR-403-SCOPE",
  "message": "API key lacks required scope 'write:metrics'.",
  "requestId": "req_9f2c…"
}
```

## 400 — Bad Request

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-400-JSON`   | Malformed JSON body                       | Validate request payload.            |
| `BR-400-PARAM`  | Missing/invalid parameter                 | Check required params.               |

## 401 — Unauthenticated

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-401-AUTH`   | Missing or invalid API key                | Provide a valid Bearer key.          |

## 403 — Forbidden

| Code                 | Meaning                                | Fix                                       |
|----------------------|----------------------------------------|-------------------------------------------|
| `BR-403-SCOPE`       | Key lacks the required scope           | Grant the scope or use an admin key.      |
| `BR-403-IP`          | Source IP not on workspace allowlist   | Add caller IP to Shield IP allowlist.     |
| `BR-403-ENTITLEMENT` | Plan tier not entitled to feature      | Upgrade plan or add the module.           |
| `BR-403-SIGNATURE`   | HMAC signature/timestamp invalid       | Fix clock skew (±300s) and re-sign.       |

## 404 — Not Found

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-404-RES`    | Resource does not exist                   | Verify the resource ID.              |

## 422 — Unprocessable

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-422-MAP`    | Connector field-mapping incomplete        | Complete required field mappings.    |

## 429 — Rate Limited

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-429-RATE`   | Rate limit exceeded for plan              | Back off; honor `Retry-After`.       |

## 5xx — Server

| Code            | Meaning                                   | Fix                                  |
|-----------------|-------------------------------------------|--------------------------------------|
| `BR-500-INT`    | Internal error                            | Retry; if persistent open a P1/P2.   |
| `BR-503-MAINT`  | Temporary maintenance                     | Retry after `Retry-After`.           |

For the 403 first-response checklist see `troubleshooting-runbook.md`.
