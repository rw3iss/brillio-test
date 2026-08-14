"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS_PATH = exports.ROUTES = exports.DEFAULT_CRITICAL_PERCENT = exports.DEFAULT_WARN_PERCENT = exports.API_KEY_HEADER = void 0;
/** Header carrying the client API key for REST requests. */
exports.API_KEY_HEADER = 'x-api-key';
/** Default warning thresholds (percent of context window). */
exports.DEFAULT_WARN_PERCENT = 75;
exports.DEFAULT_CRITICAL_PERCENT = 90;
/** Canonical REST routes, mirrored by the client SDK. */
exports.ROUTES = {
    providers: '/providers',
    knowledgeBases: '/knowledge-bases',
    chat: '/chat',
    session: (id) => `/sessions/${id}`,
    sessionExport: (id) => `/sessions/${id}/export`,
    sessionsByUser: '/sessions',
    usage: '/usage',
    health: '/health',
};
/** WebSocket namespace/path used by the gateway and the SDK. */
exports.WS_PATH = '/ws';
//# sourceMappingURL=constants.js.map