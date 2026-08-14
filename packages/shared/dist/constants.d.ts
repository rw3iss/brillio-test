/** Header carrying the client API key for REST requests. */
export declare const API_KEY_HEADER = "x-api-key";
/** Default warning thresholds (percent of context window). */
export declare const DEFAULT_WARN_PERCENT = 75;
export declare const DEFAULT_CRITICAL_PERCENT = 90;
/** Canonical REST routes, mirrored by the client SDK. */
export declare const ROUTES: {
    readonly providers: "/providers";
    readonly knowledgeBases: "/knowledge-bases";
    readonly chat: "/chat";
    readonly session: (id: string) => string;
    readonly sessionExport: (id: string) => string;
    readonly sessionsByUser: "/sessions";
    readonly usage: "/usage";
    readonly health: "/health";
};
/** WebSocket namespace/path used by the gateway and the SDK. */
export declare const WS_PATH = "/ws";
//# sourceMappingURL=constants.d.ts.map