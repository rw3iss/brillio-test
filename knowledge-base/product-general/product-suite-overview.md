# Brillio Product Suite Overview

Brillio is a B2B SaaS platform for operational analytics and workflow
automation. The suite is composed of one core platform and three modules that
can be licensed independently or bundled.

## The Suite

### Brillio Core (platform)
The foundation for every Brillio deployment. Provides workspaces, projects,
user & role management, dashboards, the REST API, and the extension framework
that the other modules plug into. Every plan tier includes Brillio Core.

- Current platform version: **Core 7.4**
- Included in: all tiers (Starter, Team, Pro, Enterprise)

### Brillio Analytics (module)
Real-time and historical analytics engine: metric pipelines, custom reports,
cohort analysis, anomaly detection, and scheduled exports.

- Current module version: **Analytics 4.2** (released 2024-10-15)
- Availability: add-on on Starter/Team; **included** on Pro and Enterprise

### Brillio Connect (integrations)
Managed connector framework for syncing data with external systems
(Salesforce, Slack, HubSpot, Snowflake, Jira, and more). Handles auth, retries,
and field mapping.

- Current module version: **Connect 3.1**
- Availability: 2 connectors (Starter), 10 (Team), unlimited (Pro/Enterprise)

### Brillio Shield (security & identity)
Security and identity layer: SSO (SAML 2.0), SCIM provisioning, audit logging,
IP allowlists, encryption key management, and compliance tooling.

- Current module version: **Shield 2.3**
- Tiers: Basic → Standard → Advanced (maps to plan tier)

## Which module answers what

| Persona            | Primary modules                          |
|--------------------|------------------------------------------|
| Sales Executive    | Core + pricing/feature docs              |
| Support Engineer   | Core, Connect (integrations), Shield     |
| Product Trainer    | Core, Analytics (onboarding & reporting) |

## Consistency notes

- Plan tier names are always: **Starter, Team, Pro, Enterprise**.
- SSO via SAML 2.0 is delivered by **Brillio Shield** and is available on
  **Pro and Enterprise** tiers only.
- For pricing figures see `pricing-and-tiers.md` / `pricing.json`.
- For integration compatibility see `integrations.json` and
  `technical-docs/integration-guide-salesforce.md`.
