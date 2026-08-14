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
var WsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsGateway = void 0;
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
const shared_1 = require("@brillio/shared");
const command_dispatcher_1 = require("./command-dispatcher");
/** EventSink backed by a native WebSocket frame writer. */
class WsEventSink {
    socket;
    constructor(socket) {
        this.socket = socket;
    }
    get isOpen() {
        return this.socket.readyState === ws_1.WebSocket.OPEN;
    }
    send(event) {
        if (this.isOpen)
            this.socket.send(JSON.stringify(event));
    }
    close() {
        if (this.isOpen)
            this.socket.close();
    }
}
/**
 * Native WebSocket transport. Attaches to the existing HTTP server on WS_PATH
 * and forwards each frame (a ClientCommand) to the shared CommandDispatcher.
 * Streaming happens off the event loop per-message, so the server is never held.
 */
let WsGateway = WsGateway_1 = class WsGateway {
    dispatcher;
    logger = new common_1.Logger(WsGateway_1.name);
    wss;
    constructor(dispatcher) {
        this.dispatcher = dispatcher;
    }
    bind(server) {
        this.wss = new ws_1.WebSocketServer({ server, path: shared_1.WS_PATH });
        this.wss.on('connection', (socket) => this.onConnection(socket));
        this.logger.log(`WebSocket gateway listening on ${shared_1.WS_PATH}`);
    }
    onConnection(socket) {
        const sink = new WsEventSink(socket);
        socket.on('message', (raw) => {
            let command;
            try {
                command = JSON.parse(raw.toString());
            }
            catch {
                sink.send({
                    type: 'error',
                    requestId: 'unknown',
                    code: 'bad_request',
                    message: 'Malformed command JSON',
                    recoverable: false,
                });
                return;
            }
            // Fire-and-forget: each command streams independently without blocking others.
            void this.dispatcher.dispatch(command, sink).catch((err) => {
                this.logger.error(`Dispatch error: ${err.message}`);
            });
        });
        socket.on('error', (err) => this.logger.warn(`Socket error: ${err.message}`));
    }
};
exports.WsGateway = WsGateway;
exports.WsGateway = WsGateway = WsGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [command_dispatcher_1.CommandDispatcher])
], WsGateway);
//# sourceMappingURL=ws.gateway.js.map