# Brillio SLA & Support Policy

_Effective 2024-11-01 · Applies to all Brillio Suite products_

This document defines Brillio's support tiers, ticket priority levels, and the
Service Level Agreement (SLA) response and resolution targets.

## Support tiers by plan

| Plan tier  | Support level | Coverage hours          | Channels                    |
|------------|---------------|-------------------------|-----------------------------|
| Starter    | Community     | Community forum only    | Forum, docs                 |
| Team       | Standard      | Business hours (9×5)    | Email, portal               |
| Pro        | Priority      | Business hours + P1 24×7| Email, portal, chat         |
| Enterprise | Premier       | 24×7                    | Email, portal, chat, phone, dedicated TAM |

"Business hours" = Monday–Friday, 08:00–18:00 in the customer's primary region
time zone, excluding local public holidays.

## Ticket priority definitions

- **P1 — Critical:** Production down or a critical function unusable for all
  users; no workaround. (e.g., total outage, data loss, security incident.)
- **P2 — High:** Major function impaired or degraded for many users; a
  workaround may exist but is unsustainable.
- **P3 — Normal:** Minor issue, question, or single-user problem with a viable
  workaround; cosmetic defects; how-to questions.

## SLA response & resolution targets

Targets are measured from ticket acknowledgement during applicable coverage
hours.

| Priority | Response target | Resolution / mitigation target | Coverage        |
|----------|-----------------|--------------------------------|-----------------|
| **P1**   | **1 hour**      | **4 hours**                    | **24×7** (Pro & Enterprise) |
| **P2**   | 4 hours         | 1 business day                 | Business hours  |
| **P3**   | 1 business day  | 3 business days                | Business hours  |

Notes:
- **P1 response time is 1 hour and the P1 resolution/mitigation target is
  4 hours.** P1 tickets are handled 24×7 on Pro and Enterprise plans.
- On the **Team** plan, P1 and P2 tickets are handled during business hours only
  (no after-hours P1 coverage).
- "Resolution" may mean a mitigation/workaround that restores service, with a
  permanent fix to follow.

## Uptime SLA (service availability)

| Plan tier  | Monthly uptime SLA | Service credits           |
|------------|--------------------|---------------------------|
| Starter    | None               | —                         |
| Team       | 99.5%              | —                         |
| Pro        | 99.9%              | Up to 10% of monthly fee  |
| Enterprise | 99.95%             | Up to 25% of monthly fee  |

Service credits are requested within 30 days of the incident and applied to a
future invoice.

## Escalation

- Enterprise customers escalate through their **dedicated TAM**.
- All customers may escalate an open P1/P2 via the support portal "Escalate"
  action, which pages the on-call engineer for P1.

See `troubleshooting-runbook.md` and `error-codes.md` for self-service
diagnostics before opening a ticket.
