# Brillio Release Notes

Versioned release notes for the Brillio Suite. Newest first. Dates are release
(GA) dates.

---

## Brillio Analytics 4.2 — 2024-10-15

This release focuses on faster reporting, smarter alerting, and export
flexibility for the **Analytics** module.

**New features in v4.2:**

1. **Real-time streaming metrics** — metric pipelines now update dashboards in
   under 5 seconds (previously up to 60s batch). Available on Enterprise.
2. **ML-based anomaly detection** — automatic detection of outliers on any
   numeric metric, with configurable sensitivity and Slack/email alerts.
3. **Cohort analysis builder** — define cohorts by first-seen date and any
   attribute, then compare retention and metric curves across cohorts.
4. **Scheduled exports to Snowflake and S3** — recurring report exports in CSV
   and Parquet, with column-level field mapping.
5. **Custom report builder v2** — drag-and-drop report designer with saved
   templates, calculated fields, and cross-filtering.
6. **Query performance** — the metric query engine is up to **40% faster** on
   large time ranges due to a new columnar cache.

**Fixes & changes in v4.2:**
- Fixed timezone drift in scheduled reports crossing DST boundaries.
- Deprecated the legacy `/v1/reports/export` endpoint (removed in v5.0).

---

## Brillio Analytics 4.1 — 2024-07-09
- Added funnel visualization to dashboards.
- Introduced report folders and sharing permissions.
- Performance improvements to the export queue.

---

## Brillio Connect 3.1 — 2024-09-20
- Added Microsoft Dynamics 365 connector.
- Salesforce connector updated to require **API v58.0 (Winter '24)** minimum.
- Retry/backoff tuning to reduce duplicate syncs.

---

## Brillio Shield 2.3 — 2024-08-14
- Added SCIM 2.0 automated provisioning (Enterprise).
- SAML 2.0 SSO now supports IdP-initiated login flows.
- IP allowlist entries increased from 50 to 200 per workspace.

---

## Brillio Core 7.4 — 2024-10-01
- API v2 rate limits raised for Pro and Enterprise tiers.
- New webhook delivery retry policy (exponential backoff, 24h retention).
- Custom roles now support per-project scoping.
