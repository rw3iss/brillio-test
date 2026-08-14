# Brillio Security & SSO (SAML 2.0) — Whitepaper

_Module: Brillio Shield 2.3 · Belongs to both Technical Docs and Support & SLA_

Brillio Shield provides the identity and security layer for the suite. This
document describes Single Sign-On (SSO), provisioning, and related security
controls, and which products/tiers support them.

## SSO via SAML 2.0

Brillio supports **SSO using the SAML 2.0 protocol**. SSO is delivered by the
**Brillio Shield** module and is available on the following tiers:

| Tier       | SSO via SAML 2.0 | SCIM provisioning |
|------------|:----------------:|:-----------------:|
| Starter    | No               | No                |
| Team       | No               | No                |
| **Pro**    | **Yes**          | No                |
| **Enterprise** | **Yes**      | **Yes**           |

SSO applies across the entire Brillio Suite — **Brillio Core, Brillio Analytics,
Brillio Connect, and Brillio Shield** all authenticate through the same SAML 2.0
session. In other words, once SSO is enabled for a workspace, every Brillio
product the workspace uses is covered by SAML 2.0.

### Supported identity providers (IdPs)

All IdPs are supported through standard SAML 2.0:

- Okta
- Microsoft Entra ID (Azure AD)
- Google Workspace
- OneLogin
- PingFederate

Both **SP-initiated** and **IdP-initiated** login flows are supported
(IdP-initiated added in Shield 2.3).

## Configuring SAML 2.0 SSO

1. In Brillio, go to **Shield → Single Sign-On → SAML 2.0**.
2. Copy the Brillio **SP Entity ID** and **ACS (Assertion Consumer Service) URL**
   into your IdP.
3. Upload the IdP metadata XML (or paste the IdP SSO URL and X.509 signing
   certificate) into Brillio.
4. Map SAML attributes: `email` (required), `firstName`, `lastName`, `groups`.
5. Test with the built-in **Test SSO** button before enforcing.
6. Optionally enable **Enforce SSO** to disable password login.

## SCIM provisioning (Enterprise)

Enterprise workspaces can enable **SCIM 2.0** for automated user
provisioning and deprovisioning from the IdP. Configure under
**Shield → Provisioning → SCIM**; Brillio issues a SCIM base URL and bearer
token for the IdP.

## Other Shield security controls

- **IP allowlisting** — up to 200 CIDR ranges per workspace (Team+).
- **Audit logs** — retention by tier: 7 days (Starter), 30 days (Team),
  1 year (Pro), 7 years (Enterprise).
- **Encryption** — data encrypted at rest (AES-256) and in transit (TLS 1.2+).
  Customer-managed keys (CMK) available on Enterprise.
- **Signed API requests** — HMAC-SHA256 with a 5-minute timestamp tolerance to
  prevent replay (see `api-reference.md`).

## Compliance

Brillio maintains SOC 2 Type II. BAA and DPA are available on Pro and
Enterprise. Data residency options: US, EU, APAC (custom on Enterprise).
