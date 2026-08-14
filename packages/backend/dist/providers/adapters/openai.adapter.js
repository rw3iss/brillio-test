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
exports.OpenAiAdapter = void 0;
const common_1 = require("@nestjs/common");
const provider_types_1 = require("../provider.types");
/** OpenAI GPT adapter over the Chat Completions streaming API. */
class OpenAiAdapter {
    model;
    apiKey;
    id = 'openai';
    logger = new common_1.Logger(OpenAiAdapter.name);
    constructor(model, apiKey) {
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return !!this.apiKey;
    }
    unavailableReason() {
        return this.apiKey ? undefined : 'OPENAI_API_KEY not configured';
    }
    async *stream(params) {
        if (!this.apiKey)
            throw new provider_types_1.ProviderError('OpenAI not configured', 'auth', this.id);
        const { default: OpenAI } = await Promise.resolve().then(() => __importStar(require('openai')));
        const client = new OpenAI({ apiKey: this.apiKey });
        try {
            const stream = await client.chat.completions.create({
                model: this.model,
                stream: true,
                stream_options: { include_usage: true },
                messages: [
                    { role: 'system', content: params.systemPrompt },
                    ...params.messages.map((m) => ({ role: m.role, content: m.content })),
                ],
            });
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of stream) {
                if (params.signal?.aborted)
                    break;
                const token = chunk.choices[0]?.delta?.content;
                if (token)
                    yield { type: 'token', text: token };
                if (chunk.usage) {
                    inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
                    outputTokens = chunk.usage.completion_tokens ?? outputTokens;
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
        const message = err?.message ?? 'OpenAI request failed';
        this.logger.warn(`OpenAI error: ${message}`);
        if (status === 429)
            return new provider_types_1.ProviderError(message, 'rate_limit', this.id, true);
        if (status === 401 || status === 403)
            return new provider_types_1.ProviderError(message, 'auth', this.id);
        return new provider_types_1.ProviderError(message, 'unavailable', this.id, true);
    }
}
exports.OpenAiAdapter = OpenAiAdapter;
//# sourceMappingURL=openai.adapter.js.map