# Brillio — Streaming Multi-Provider Chatbot with Knowledge-Base RAG

A pnpm monorepo: a NestJS streaming backend, a shared TS contract, a React
client + SDK, and a sample knowledge base. Answers are grounded in a selectable
knowledge base (RAG) and streamed token-by-token over WebSocket (primary) or SSE
(fallback), with full per-request token/cost accounting and automatic provider
fallback across Claude, OpenAI, and Gemini.

See `requirements.md` for the architecture/design.

## Packages

| Path | Package | What |
|------|---------|------|
| `packages/shared` | `@brillio/shared` | Types + transport-agnostic command/event protocol + cost math (client & server) |
| `packages/backend` | `@brillio/backend` | NestJS API, WS + SSE transports, provider adapters, BM25 RAG, sessions, usage |
| `packages/client` | `@brillio/client` | React + SASS UI and the mirror SDK |
| `knowledge-base/` | — | 3 document groups (md/pdf/json) + `index.json` |
| `config/app.config.json` | — | All static config read at runtime |

## Prerequisites

- Node 22+, pnpm 11+

## Install & build

```bash
pnpm install
pnpm build:shared          # build the shared contract first
pnpm --filter @brillio/backend exec nest build
```

## Provider API keys (optional)

Without keys the backend runs on the built-in **mock** provider (offline,
streams a retrieval-grounded answer, $0 cost) — the whole pipeline works. For
real answers, export any of:

```bash
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=...
```

Providers with a configured key report `available`; others show `unavailable`
(greyed in the client) and are skipped by the fallback router. The client API
key is `brillio-dev-key-2026` (see `config/app.config.json` → `auth.apiKeys`).

## Run

```bash
# terminal 1 — backend on http://localhost:4180 (ingests the KB on boot)
pnpm dev:backend            # or: node packages/backend/dist/main.js

# terminal 2 — client on http://localhost:5173 (proxies REST + /ws to the backend)
pnpm dev:client
```

Re-ingest the knowledge base explicitly (also happens automatically on boot):

```bash
pnpm kb:ingest
```

## API surface

- `GET  /health`
- `GET  /providers` → `ProviderInfo[]` (id, status, pricing, contextWindow)
- `GET  /knowledge-bases` → `KnowledgeBaseInfo[]`
- `POST /chat` → SSE stream of `ServerEvent`s (body = `ChatRequest`)
- `GET  /sessions?userId=` · `GET /sessions/:id`
- `GET  /sessions/:id/export?format=json|csv`
- `GET  /usage?scope=user|session|provider|system&key=`
- `WS   /ws` → command channel (`chat`, `switch_provider`, `cancel`, `ping`)

All requests carry the API key (`x-api-key` header, `?apiKey=`, or the `apiKey`
field of a command envelope).

### Quick smoke test (mock provider)

```bash
curl -N -H 'x-api-key: brillio-dev-key-2026' -H 'content-type: application/json' \
  -d '{"provider":"claude","knowledgeBaseId":"support-sla",
       "messages":[{"role":"user","content":"What is the SLA for Priority 1 support tickets?"}]}' \
  http://localhost:4180/chat
```

You'll see `ack → sources → provider_switched (claude→mock) → token… → usage → done`.

## How streaming works (the short version)

`ClientCommand` in → stream of `ServerEvent`s out. An `EventSink` abstracts "how
to push an event" (WebSocket frame vs SSE write); both transports adapt to it and
call one `CommandDispatcher` → `ChatService`. The orchestrator retrieves RAG
context, streams from a provider adapter, and relays each token through the sink
as it arrives — nothing is buffered to completion. Provider adapters normalize
each vendor's native streaming SDK into `{ token | thinking | usage }` events, so
adding a provider or a transport never touches the orchestration.
