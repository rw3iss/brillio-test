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
var CommandDispatcher_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandDispatcher = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const api_key_service_1 = require("../auth/api-key.service");
const session_service_1 = require("../session/session.service");
const chat_service_1 = require("../chat/chat.service");
/**
 * The single entry point for every transport. A ClientCommand + an EventSink go
 * in; normalized ServerEvents come back over the sink. Neither WebSocket nor SSE
 * logic lives here — only routing, auth, and cancellation.
 */
let CommandDispatcher = CommandDispatcher_1 = class CommandDispatcher {
    apiKeys;
    sessions;
    chat;
    logger = new common_1.Logger(CommandDispatcher_1.name);
    /** Active in-flight requests keyed by requestId, for cancellation. */
    inflight = new Map();
    constructor(apiKeys, sessions, chat) {
        this.apiKeys = apiKeys;
        this.sessions = sessions;
        this.chat = chat;
    }
    async dispatch(command, sink) {
        const requestId = command.id || (0, uuid_1.v4)();
        if (!this.apiKeys.isValid(command.apiKey)) {
            sink.send({
                type: 'error',
                requestId,
                code: 'auth',
                message: 'Invalid or missing API key',
                recoverable: false,
            });
            return;
        }
        switch (command.type) {
            case 'chat':
                return this.runChat(requestId, command.payload, sink);
            case 'switch_provider':
                return this.switchProvider(requestId, command.payload, sink);
            case 'cancel':
                return this.cancel(requestId, command.payload);
            case 'ping':
                sink.send({ type: 'ack', requestId, sessionId: '' });
                return;
            default:
                sink.send({
                    type: 'error',
                    requestId,
                    code: 'bad_request',
                    message: `Unknown command type: ${command.type}`,
                    recoverable: false,
                });
        }
    }
    async runChat(requestId, payload, sink) {
        const controller = new AbortController();
        this.inflight.set(requestId, controller);
        try {
            await this.chat.handleChat(payload, requestId, sink, controller.signal);
        }
        finally {
            this.inflight.delete(requestId);
        }
    }
    switchProvider(requestId, payload, sink) {
        try {
            const session = this.sessions.setProvider(payload.sessionId, payload.provider);
            sink.send({ type: 'ack', requestId, sessionId: session.id });
        }
        catch (err) {
            sink.send({
                type: 'error',
                requestId,
                code: 'bad_request',
                message: err.message,
                recoverable: false,
            });
        }
    }
    cancel(requestId, payload) {
        // Cancel by explicit requestId if provided, else all in-flight (best effort).
        const target = this.inflight.get(requestId);
        if (target) {
            target.abort();
            return;
        }
        this.logger.debug(`Cancel requested for session ${payload.sessionId}`);
        for (const controller of this.inflight.values())
            controller.abort();
    }
};
exports.CommandDispatcher = CommandDispatcher;
exports.CommandDispatcher = CommandDispatcher = CommandDispatcher_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService,
        session_service_1.SessionService,
        chat_service_1.ChatService])
], CommandDispatcher);
//# sourceMappingURL=command-dispatcher.js.map