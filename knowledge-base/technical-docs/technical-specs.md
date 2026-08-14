# Brillio Technical Specifications

_Core 7.4 · Reference for Support Engineers and Product Trainers_

## Platform architecture

- Multi-tenant SaaS, region-isolated (US, EU, APAC).
- Data stores: PostgreSQL (metadata), ClickHouse (metric/columnar analytics),
  object storage (exports/attachments).
- All traffic over TLS 1.2+; internal service mesh with mTLS.

## Limits & quotas

| Resource                        | Starter | Team  | Pro    | Enterprise |
|---------------------------------|:-------:|:-----:|:------:|:----------:|
| API rate limit (req/min)        | 60      | 300   | 1,200  | 6,000      |
| Max projects per workspace      | 5       | 25    | 200    | Unlimited  |
| Max seats                       | 25      | 100   | 1,000  | Unlimited  |
| Webhook endpoints per workspace | 0       | 10    | 50     | 200        |
| IP allowlist entries            | 0       | 200   | 200    | 200        |
| Data retention (metrics)        | 90 days | 1 yr  | 2 yr   | 5 yr       |

## API essentials

- Base URL: `https://api.brillio.example/v2`
- Auth: Bearer API key or HMAC-signed requests.
- Signed-request clock skew tolerance: **300 seconds**.
- Rate-limit response: HTTP 429 with `Retry-After`.

## Data formats

- All timestamps are ISO 8601 UTC.
- Metric export formats: CSV, Parquet (Parquet requires Analytics 4.2+).

## Browser & client support

- Web app supports the latest 2 versions of Chrome, Edge, Firefox, Safari.
- Official SDKs: JavaScript/TypeScript, Python, Java.

## Versioning & support windows

- API path-versioned (`/v2`); deprecated versions get 12 months notice.
- Module versions currently GA: Core 7.4, Analytics 4.2, Connect 3.1,
  Shield 2.3.
