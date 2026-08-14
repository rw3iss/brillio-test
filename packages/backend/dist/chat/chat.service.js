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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const shared_1 = require("@brillio/shared");
const config_service_1 = require("../config/config.service");
const rag_service_1 = require("../knowledge-base/rag.service");
const kb_index_service_1 = require("../knowledge-base/kb-index.service");
const session_service_1 = require("../session/session.service");
const usage_service_1 = require("../usage/usage.service");
const provider_router_service_1 = require("../providers/provider-router.service");
const provider_types_1 = require("../providers/provider.types");
const CONTEXT_MARKER = 'KNOWLEDGE BASE CONTEXT:';
/**
 * Orchestrates one chat turn: RAG grounding → provider streaming (with
 * automatic fallback) → live token relay → usage/cost persistence. Fully
 * transport-agnostic; it only touches the provided EventSink.
 */
let ChatService = ChatService_1 = class ChatService {
    config;
    kbIndex;
    rag;
    sessions;
    usage;
    router;
    logger = new common_1.Logger(ChatService_1.name);
    constructor(config, kbIndex, rag, sessions, usage, router) {
        this.config = config;
        this.kbIndex = kbIndex;
        this.rag = rag;
        this.sessions = sessions;
        this.usage = usage;
        this.router = router;
    }
    async handleChat(payload, requestId, sink, signal) {
        const started = Date.now();
        try {
            if (!payload.messages?.length) {
                return this.fail(sink, requestId, 'bad_request', 'No messages provided', false);
            }
            if (!this.kbIndex.hasGroup(payload.knowledgeBaseId)) {
                return this.fail(sink, requestId, 'no_knowledge_base', `Unknown knowledge base: ${payload.knowledgeBaseId}`, false);
            }
            const userId = payload.userId ?? 'anonymous';
            const desired = payload.provider;
            const systemPrompt = this.config.resolveSystemPrompt(payload.systemPrompt);
            // Resolve or create the session, then append the incoming turn(s).
            const session = payload.sessionId
                ? this.sessions.setProvider(payload.sessionId, desired)
                : this.sessions.create({
                    userId,
                    knowledgeBaseId: payload.knowledgeBaseId,
                    provider: desired,
                    systemPrompt,
                });
            for (const m of payload.messages) {
                this.sessions.addMessage(session.id, this.toMessage(m.role, m.content));
            }
            if (sink.isOpen)
                sink.send({ type: 'ack', requestId, sessionId: session.id });
            const question = [...payload.messages].reverse().find((m) => m.role === 'user')?.content ?? '';
            // RAG grounding.
            const { sources, contextText } = this.rag.retrieve(payload.knowledgeBaseId, question);
            if (sink.isOpen)
                sink.send({ type: 'sources', requestId, sources });
            const groundedSystem = `${systemPrompt}\n\n${CONTEXT_MARKER}\n` +
                (contextText || '(no relevant documents were found for this question)');
            const history = this.sessions.history(session.id);
            // Provider streaming with automatic fallback.
            const candidates = this.router.fallbackOrder(desired);
            let assistantText = '';
            let inputTokens = 0;
            let outputTokens = 0;
            let usedProvider = null;
            for (let i = 0; i < candidates.length; i++) {
                const provider = candidates[i];
                if (i > 0 || provider.id !== desired) {
                    this.notifySwitch(sink, requestId, desired, provider.id, candidates, i);
                }
                try {
                    const result = await this.streamProvider(provider, { model: this.config.getProvider(provider.id)?.model ?? provider.id, systemPrompt: groundedSystem, messages: history, signal }, requestId, sink);
                    assistantText = result.text;
                    inputTokens = result.inputTokens || (0, shared_1.estimateTokens)(groundedSystem + question);
                    outputTokens = result.outputTokens || (0, shared_1.estimateTokens)(assistantText);
                    usedProvider = provider.id;
                    break;
                }
                catch (err) {
                    const handled = this.handleProviderError(err, sink, requestId, i === candidates.length - 1);
                    if (handled === 'stop')
                        return;
                    // otherwise continue to next candidate
                }
            }
            if (!usedProvider) {
                return this.fail(sink, requestId, 'provider_unavailable', 'All providers failed', true);
            }
            const latencyMs = Date.now() - started;
            const pricing = this.router.pricing(usedProvider);
            const cost = (0, shared_1.computeCost)({ inputTokens, outputTokens }, pricing);
            // Persist assistant message + usage record.
            this.sessions.addMessage(session.id, {
                ...this.toMessage('assistant', assistantText),
                providerId: usedProvider,
                usage: { inputTokens, outputTokens },
                cost,
            });
            this.usage.record({
                sessionId: session.id,
                userId,
                provider: usedProvider,
                model: this.config.getProvider(usedProvider)?.model ?? usedProvider,
                knowledgeBaseId: payload.knowledgeBaseId,
                question,
                inputTokens,
                outputTokens,
                cost,
                latencyMs,
            });
            // Live usage + threshold warnings.
            const sessionUsage = this.buildUsage(session.id, usedProvider, inputTokens, outputTokens);
            if (sink.isOpen)
                sink.send({ type: 'usage', requestId, usage: sessionUsage });
            this.maybeWarn(sink, requestId, sessionUsage.percentUsed);
            const meta = {
                inputTokens,
                outputTokens,
                cost,
                model: usedProvider,
                latencyMs,
                sourceChunks: sources,
            };
            if (sink.isOpen) {
                sink.send({ type: 'done', requestId, sessionId: session.id, meta, sessionUsage });
            }
        }
        catch (err) {
            this.logger.error(`handleChat failed: ${err.message}`, err.stack);
            this.fail(sink, requestId, 'internal', err.message, true);
        }
    }
    async streamProvider(provider, params, requestId, sink) {
        let text = '';
        let inputTokens = 0;
        let outputTokens = 0;
        for await (const ev of provider.stream(params)) {
            if (params.signal.aborted)
                break;
            if (ev.type === 'token') {
                text += ev.text;
                if (sink.isOpen)
                    sink.send({ type: 'token', requestId, text: ev.text });
            }
            else if (ev.type === 'thinking') {
                if (sink.isOpen)
                    sink.send({ type: 'thinking', requestId, text: ev.text });
            }
            else if (ev.type === 'usage') {
                inputTokens = ev.inputTokens;
                outputTokens = ev.outputTokens;
            }
        }
        return { text, inputTokens, outputTokens };
    }
    handleProviderError(err, sink, requestId, isLast) {
        if (err instanceof provider_types_1.ProviderError) {
            if (err.code === 'rate_limit' && sink.isOpen) {
                sink.send({
                    type: 'error',
                    requestId,
                    code: 'rate_limit',
                    message: `${err.provider} is rate-limited. Falling back; you may also wait and retry.`,
                    recoverable: true,
                    suggestion: 'wait_or_switch',
                });
            }
            this.logger.warn(`Provider ${err.provider} failed (${err.code}); ${isLast ? 'no more fallbacks' : 'trying next'}`);
            return 'continue';
        }
        this.logger.warn(`Unexpected provider error: ${err.message}`);
        return 'continue';
    }
    notifySwitch(sink, requestId, desired, to, candidates, index) {
        if (to === desired)
            return;
        const from = index === 0 ? desired : candidates[index - 1].id;
        if (sink.isOpen) {
            sink.send({
                type: 'provider_switched',
                requestId,
                from,
                to,
                reason: `${from} unavailable — switched to ${to}`,
            });
        }
    }
    buildUsage(sessionId, provider, lastInput, lastOutput) {
        const totals = this.usage.sessionTotals(sessionId);
        const contextWindow = this.router.contextWindow(provider);
        // percentUsed reflects the CURRENT context footprint (latest turn), not the
        // cumulative lifetime sum, since history is re-sent each turn.
        const currentContext = lastInput + lastOutput;
        return {
            sessionId,
            provider,
            inputTokens: totals.inputTokens,
            outputTokens: totals.outputTokens,
            totalTokens: totals.inputTokens + totals.outputTokens,
            cost: Math.round(totals.cost * 1_000_000) / 1_000_000,
            contextWindow,
            percentUsed: (0, shared_1.percentOfContext)(currentContext, contextWindow),
        };
    }
    maybeWarn(sink, requestId, percent) {
        if (!sink.isOpen)
            return;
        const { warnPercent, criticalPercent } = this.config.warnings;
        if (percent >= criticalPercent) {
            sink.send({
                type: 'warning',
                requestId,
                level: 'critical',
                percentUsed: percent,
                message: `Context usage critical (${percent.toFixed(0)}%). Consider a new session or a larger-context model.`,
            });
        }
        else if (percent >= warnPercent) {
            sink.send({
                type: 'warning',
                requestId,
                level: 'warn',
                percentUsed: percent,
                message: `Context usage high (${percent.toFixed(0)}%).`,
            });
        }
    }
    fail(sink, requestId, code, message, recoverable) {
        if (sink.isOpen) {
            sink.send({ type: 'error', requestId, code, message, recoverable });
        }
    }
    toMessage(role, content) {
        return {
            id: (0, uuid_1.v4)(),
            role: role,
            content,
            createdAt: new Date().toISOString(),
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.AppConfigService,
        kb_index_service_1.KbIndexService,
        rag_service_1.RagService,
        session_service_1.SessionService,
        usage_service_1.UsageService,
        provider_router_service_1.ProviderRouter])
], ChatService);
//# sourceMappingURL=chat.service.js.map