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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const shared_1 = require("@brillio/shared");
const api_key_guard_1 = require("../auth/api-key.guard");
const command_dispatcher_1 = require("../transport/command-dispatcher");
/** EventSink backed by an SSE (text/event-stream) response. */
class SseEventSink {
    res;
    open = true;
    constructor(res) {
        this.res = res;
    }
    get isOpen() {
        return this.open && !this.res.writableEnded;
    }
    send(event) {
        if (this.isOpen)
            this.res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    close() {
        if (this.open) {
            this.open = false;
            this.res.end();
        }
    }
}
/**
 * SSE transport for the main POST /chat operation. Streams tokens immediately
 * as an event stream, sharing the exact dispatcher/orchestrator used by WS.
 */
let ChatController = class ChatController {
    dispatcher;
    constructor(dispatcher) {
        this.dispatcher = dispatcher;
    }
    async chat(body, req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();
        const requestId = (0, uuid_1.v4)();
        const sink = new SseEventSink(res);
        const apiKey = req.header(shared_1.API_KEY_HEADER) ?? body.apiKey ?? '';
        req.on('close', () => {
            void this.dispatcher.dispatch({ id: requestId, type: 'cancel', apiKey, payload: { sessionId: body.sessionId ?? '' } }, sink);
        });
        await this.dispatcher.dispatch({ id: requestId, type: 'chat', apiKey, payload: body }, sink);
        sink.close();
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "chat", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [command_dispatcher_1.CommandDispatcher])
], ChatController);
//# sourceMappingURL=chat.controller.js.map