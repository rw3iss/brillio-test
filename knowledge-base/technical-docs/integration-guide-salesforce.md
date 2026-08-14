# Integration Guide: Salesforce (Brillio Connect)

_Module: Brillio Connect 3.1 · Applies to Team, Pro, Enterprise tiers_

Brillio integrates with Salesforce through the **Brillio Connect** module,
enabling bidirectional sync of accounts, contacts, opportunities, and custom
objects.

## Requirements

- **Salesforce API v58.0 (Winter '24) or later.** Earlier API versions are not
  supported by Connect 3.1. Confirm your org's API version in
  **Setup → Company Information → API Version**.
- Salesforce edition: **Enterprise, Unlimited, or Developer** (any edition with
  API access enabled).
- A Salesforce **Connected App** configured for **OAuth 2.0**.
- Brillio plan: **Team tier or higher** (the Salesforce connector is not
  available on Starter).

## Step 1 — Create a Salesforce Connected App

1. In Salesforce Setup, go to **App Manager → New Connected App**.
2. Enable OAuth settings; set the callback URL to
   `https://connect.brillio.example/oauth/salesforce/callback`.
3. Add OAuth scopes: `api`, `refresh_token`, `offline_access`.
4. Save and note the **Consumer Key** and **Consumer Secret**.

## Step 2 — Connect in Brillio

1. In Brillio, go to **Connect → Integrations → Salesforce → Connect**.
2. Paste the Consumer Key/Secret and complete the OAuth consent flow.
3. Choose sync direction (read, write, or bidirectional) and the objects to
   sync.

## Step 3 — Field mapping

Map Salesforce fields to Brillio entities in **Connect → Salesforce → Mapping**.
Unmapped required fields will block the sync with error `BR-422-MAP`.

## Sync behavior

- Default sync interval: **every 15 minutes** (configurable down to 5 minutes on
  Pro/Enterprise).
- Retries use exponential backoff up to 24 hours.
- Conflicts resolve **last-write-wins** by default; configurable per object.

## Troubleshooting

| Symptom                            | Likely cause / fix                                  |
|------------------------------------|-----------------------------------------------------|
| `BR-401-AUTH` on sync              | OAuth token expired — reconnect the Connected App.  |
| `BR-403-SCOPE`                     | Connected App missing `api` scope.                  |
| `INVALID_API_VERSION`              | Org below API v58.0 — upgrade Salesforce API version.|
| Records not appearing              | Check field mapping and object-level permissions.   |

See `support-sla/troubleshooting-runbook.md` for the general API 403 checklist.
