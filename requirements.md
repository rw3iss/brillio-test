# Brillio — Streaming Multi-Provider Chatbot with Knowledge-Base RAG

Monorepo (pnpm workspaces) implementing a NestJS backend, a shared TS contract,
a React client SDK+UI, and sample knowledge bases.

## Packages

- `packages/shared` (`@brillio/shared`) — the single source of truth for types
  shared by client and server: chat/provider/session/knowledge-base/usage types,
  the transport-agnostic **command/event protocol**, and cost/token math.
- `packages/backend` (`@brillio/backend`) — NestJS API + streaming transports.
- `packages/client` (`@brillio/client`) — React + SASS UI with an SDK that
  mirrors the backend.
- `knowledge-base/` — document library + `index.json` (groups + documents).
- `config/app.config.json` — all static configuration read at runtime.

## Streaming design (integrated from the "streaming agent" design)

Three concerns are decoupled:

1. **Provider adapters** — each provider (`claude`, `openai`, `gemini`, plus a
   `mock`) implements one interface: `stream(messages, opts) -> AsyncIterable<ProviderEvent>`,
   wrapping that vendor's native streaming SDK. Adapters normalize vendor deltas
   into `{ token | thinking | usage | done }` events. The Registry reports
   per-provider availability; the Router applies automatic fallback.
2. **Transport-agnostic messaging** — a `ClientCommand` envelope in, a stream of
   `ServerEvent`s out. An `EventSink` abstracts "how to push an event back"
   (WebSocket frame vs SSE write). `WsGateway` and the SSE `ChatController` both
   adapt their transport to an `EventSink` and call the same `CommandDispatcher`.
   Adding a transport = one adapter; the orchestration never changes.
3. **Caller fan-out** — the client SDK opens WS (primary) or SSE (fallback),
   sends commands, and renders normalized events token-by-token.

Flow: `client → (WS|SSE) → EventSink ← CommandDispatcher → ChatService →
RAG context → ProviderRouter → Adapter → vendor stream`, with tokens relayed
back through the same `EventSink` as they arrive (nothing is buffered to
completion).

## Sessions

A **session** is our own stored conversation (memory + SQLite), independent of
provider. Switching providers replays the full stored history to the new
provider, so continuity survives model changes. Each assistant message records
which provider produced it. Export as JSON (primary) or CSV.

## Knowledge base / RAG

`index.json` declares `groups` (selectable libraries) and `documents`
(md/pdf/json, each assignable to multiple groups). On startup and on change, the
ingestion service hashes each document, parses it (markdown/pdf/json → text),
chunks it, and builds a per-group **BM25 inverted index** in memory (self-
contained, no external embedding API; swappable for vector search later). At
query time the RAG service retrieves top-K chunks for the target group and
injects them as grounded context. The system prompt forbids guessing: if the
context lacks the answer, it says so.

## Token/cost tracking

Every answered request persists a `UsageRecord`
(`user, provider, inputTokens, outputTokens, cost, latencyMs, ...`). Aggregates
roll up per user / session / provider / system. Live `usage` events stream the
current session's `percentUsed` against the provider context window; the client
raises `warn` at 75% and `critical` at 90%.

## Providers & fallback

Configured statically in `config/app.config.json` (model, pricing per 1M tokens,
context window, API-key env var). `GET /providers` exposes id/name/status/pricing
for the client dropdown (unavailable → greyed). On unavailability or rate limits,
the router falls back to the next available provider carrying the full history +
knowledge-base id; rate limits additionally surface a "wait or switch" choice.

## API surface

- `GET  /health`
- `GET  /providers`
- `GET  /knowledge-bases`
- `POST /chat` — SSE-streamed answer (also available as a `chat` WS command)
- `GET  /sessions?userId=` / `GET /sessions/:id`
- `GET  /sessions/:id/export?format=json|csv`
- `GET  /usage?scope=user|session|provider|system&key=`
- `WS   /ws` — command channel (`chat`, `switch_provider`, `cancel`, `ping`)

All requests carry the client API key (`x-api-key` header or `apiKey` in the
command envelope), validated by the backend.

## Response metadata

`{ inputTokens, outputTokens, cost, model, latencyMs, sourceChunks }` accompanies
every completed answer (`done` event).

## Personas / demo

Knowledge bases target Sales Executive (pricing/compat), Support Engineer
(specs/integration/troubleshooting), and Product Trainer (accurate product
knowledge). Sample questions covered: Pro vs Enterprise tiers, Salesforce
integration + version, Analytics v4.2 features, API 403 triage, SSO SAML 2.0
support, P1 SLA.
