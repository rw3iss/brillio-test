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
exports.GeminiAdapter = void 0;
const common_1 = require("@nestjs/common");
const provider_types_1 = require("../provider.types");
/** Google Gemini adapter over the generateContentStream API. */
class GeminiAdapter {
    model;
    apiKey;
    id = 'gemini';
    logger = new common_1.Logger(GeminiAdapter.name);
    constructor(model, apiKey) {
        this.model = model;
        this.apiKey = apiKey;
    }
    isAvailable() {
        return !!this.apiKey;
    }
    unavailableReason() {
        return this.apiKey ? undefined : 'GEMINI_API_KEY not configured';
    }
    async *stream(params) {
        if (!this.apiKey)
            throw new provider_types_1.ProviderError('Gemini not configured', 'auth', this.id);
        const { GoogleGenAI } = await Promise.resolve().then(() => __importStar(require('@google/genai')));
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        try {
            const response = await ai.models.generateContentStream({
                model: this.model,
                contents: params.messages.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                config: { systemInstruction: params.systemPrompt },
            });
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of response) {
                if (params.signal?.aborted)
                    break;
                const text = chunk.text;
                if (text)
                    yield { type: 'token', text };
                const usage = chunk.usageMetadata;
                if (usage) {
                    inputTokens = usage.promptTokenCount ?? inputTokens;
                    outputTokens = usage.candidatesTokenCount ?? outputTokens;
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
        const message = err?.message ?? 'Gemini request failed';
        this.logger.warn(`Gemini error: ${message}`);
        if (status === 429)
            return new provider_types_1.ProviderError(message, 'rate_limit', this.id, true);
        if (status === 401 || status === 403)
            return new provider_types_1.ProviderError(message, 'auth', this.id);
        return new provider_types_1.ProviderError(message, 'unavailable', this.id, true);
    }
}
exports.GeminiAdapter = GeminiAdapter;
//# sourceMappingURL=gemini.adapter.js.map