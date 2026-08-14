"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_PROVIDERS = exports.ProviderError = void 0;
/** Raised by adapters so the router can decide fallback vs. surfacing. */
class ProviderError extends Error {
    code;
    provider;
    retryable;
    constructor(message, code, provider, retryable = false) {
        super(message);
        this.code = code;
        this.provider = provider;
        this.retryable = retryable;
        this.name = 'ProviderError';
    }
}
exports.ProviderError = ProviderError;
exports.CHAT_PROVIDERS = Symbol('CHAT_PROVIDERS');
//# sourceMappingURL=provider.types.js.map