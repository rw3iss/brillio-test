"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const session_repository_1 = require("../persistence/session.repository");
/** Owns session lifecycle; storage is provider-agnostic and survives model switches. */
let SessionService = class SessionService {
    repo;
    cache = new Map();
    constructor(repo) {
        this.repo = repo;
    }
    create(params) {
        const now = new Date().toISOString();
        const session = {
            id: (0, uuid_1.v4)(),
            userId: params.userId,
            knowledgeBaseId: params.knowledgeBaseId,
            provider: params.provider,
            systemPrompt: params.systemPrompt,
            title: params.title ?? 'New session',
            createdAt: now,
            updatedAt: now,
            messages: [],
        };
        this.persist(session);
        return session;
    }
    get(id) {
        if (this.cache.has(id))
            return this.cache.get(id);
        const found = this.repo.findById(id);
        if (found)
            this.cache.set(id, found);
        return found;
    }
    getOrThrow(id) {
        const s = this.get(id);
        if (!s)
            throw new common_1.NotFoundException(`Session ${id} not found`);
        return s;
    }
    listByUser(userId) {
        return this.repo.listByUser(userId);
    }
    addMessage(sessionId, message) {
        const session = this.getOrThrow(sessionId);
        session.messages.push(message);
        if (session.messages.length === 1 && message.role === 'user') {
            session.title = message.content.slice(0, 60);
        }
        session.updatedAt = new Date().toISOString();
        this.persist(session);
        return session;
    }
    setProvider(sessionId, provider) {
        const session = this.getOrThrow(sessionId);
        session.provider = provider;
        session.updatedAt = new Date().toISOString();
        this.persist(session);
        return session;
    }
    /** History replayed to a provider (system prompt handled separately). */
    history(sessionId) {
        return this.getOrThrow(sessionId)
            .messages.filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content }));
    }
    export(id, format) {
        const session = this.getOrThrow(id);
        if (format === 'csv') {
            return {
                filename: `session-${id}.csv`,
                mime: 'text/csv',
                body: toCsv(session),
            };
        }
        return {
            filename: `session-${id}.json`,
            mime: 'application/json',
            body: JSON.stringify(session, null, 2),
        };
    }
    persist(session) {
        this.cache.set(session.id, session);
        this.repo.upsert(session);
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_repository_1.SessionRepository])
], SessionService);
function toCsv(session) {
    const header = ['index', 'role', 'provider', 'createdAt', 'inputTokens', 'outputTokens', 'cost', 'content'];
    const rows = session.messages.map((m, i) => [
        String(i),
        m.role,
        m.providerId ?? '',
        m.createdAt,
        String(m.usage?.inputTokens ?? ''),
        String(m.usage?.outputTokens ?? ''),
        String(m.cost ?? ''),
        csvEscape(m.content),
    ]);
    return [header, ...rows].map((r) => r.join(',')).join('\n');
}
function csvEscape(text) {
    const needsQuote = /[",\n]/.test(text);
    const escaped = text.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
}
//# sourceMappingURL=session.service.js.map