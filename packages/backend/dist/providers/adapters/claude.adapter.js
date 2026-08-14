"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAdapter = void 0;
const common_1 = require("@nestjs/common");
const provider_types_1 = require("../provider.types");
/** Anthropic Claude adapter over the Messages streaming API. */
class ClaudeAdapter {
    model;
    apiKey;
    id = 'claude';
    logger = new common_1.Logger(ClaudeAdapter.name);
    constructor(model, apiKey) {
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return !!this.apiKey;
    }
    unavailableReason() {
        return this.apiKey ? undefined : 'ANTHROPIC_API_KEY not configured';
    }
    async *stream(params) {
        if (!this.apiKey)
            throw new provider_types_1.ProviderError('Claude not configured', 'auth', this.id);
        const { default: Anthropic } = await Promise.resolve().then(() => __importStar(require('@anthropic-ai/sdk')));
        const client = new Anthropic({ apiKey: this.apiKey });
        try {
            const stream = client.messages.stream({
                model: this.model,
                max_tokens: 2048,
                system: params.systemPrompt,
                messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
            });
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const event of stream) {
                if (params.signal?.aborted)
                    break;
                if (event.type === 'message_start') {
                    inputTokens = event.message.usage?.input_tokens ?? 0;
                }
                else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    yield { type: 'token', text: event.delta.text };
                }
                else if (event.type === 'message_delta') {
                    outputTokens = event.usage?.output_tokens ?? outputTokens;
                }
            }
            yield { type: 'usage', inputTokens, outputTokens };
        }
        catch (err) {
            throw this.mapError(err);
        }
    }
    mapError(err) {
        const status = err?.status;
        const message = err?.message ?? 'Claude request failed';
        this.logger.warn(`Claude error: ${message}`);
        if (status === 429)
            return new provider_types_1.ProviderError(message, 'rate_limit', this.id, true);
        if (status === 401 || status === 403)
            return new provider_types_1.ProviderError(message, 'auth', this.id);
        return new provider_types_1.ProviderError(message, 'unavailable', this.id, true);
    }
}
exports.ClaudeAdapter = ClaudeAdapter;
//# sourceMappingURL=claude.adapter.js.map