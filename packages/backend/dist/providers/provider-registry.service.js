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
var ProviderRegistry_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const claude_adapter_1 = require("./adapters/claude.adapter");
const openai_adapter_1 = require("./adapters/openai.adapter");
const gemini_adapter_1 = require("./adapters/gemini.adapter");
const mock_adapter_1 = require("./adapters/mock.adapter");
/** Builds provider adapters from config and reports their public status. */
let ProviderRegistry = ProviderRegistry_1 = class ProviderRegistry {
    config;
    logger = new common_1.Logger(ProviderRegistry_1.name);
    adapters = new Map();
    constructor(config) {
        this.config = config;
        for (const p of this.config.providers) {
            if (!p.enabled)
                continue;
            const key = this.config.providerApiKey(p.id);
            const adapter = this.build(p.id, p.model, key);
            if (adapter)
                this.adapters.set(p.id, adapter);
        }
        const available = [...this.adapters.values()].filter((a) => a.isAvailable()).map((a) => a.id);
        this.logger.log(`Providers available: ${available.join(', ') || '(mock only)'}`);
    }
    build(id, model, key) {
        switch (id) {
            case 'claude':
                return new claude_adapter_1.ClaudeAdapter(model, key);
            case 'openai':
                return new openai_adapter_1.OpenAiAdapter(model, key);
            case 'gemini':
                return new gemini_adapter_1.GeminiAdapter(model, key);
            case 'mock':
                return new mock_adapter_1.MockAdapter();
            default:
                return undefined;
        }
    }
    get(id) {
        return this.adapters.get(id);
    }
    has(id) {
        return this.adapters.has(id);
    }
    isAvailable(id) {
        return !!this.adapters.get(id)?.isAvailable();
    }
    /** Public descriptors for GET /providers. */
    list() {
        return this.config.providers
            .filter((p) => p.enabled)
            .map((p) => {
            const adapter = this.adapters.get(p.id);
            const available = !!adapter?.isAvailable();
            return {
                id: p.id,
                name: p.name,
                model: p.model,
                status: available ? 'available' : 'unavailable',
                statusReason: available ? undefined : adapter?.unavailableReason(),
                pricing: p.pricing,
                contextWindow: p.contextWindow,
            };
        });
    }
};
exports.ProviderRegistry = ProviderRegistry;
exports.ProviderRegistry = ProviderRegistry = ProviderRegistry_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.AppConfigService])
], ProviderRegistry);
//# sourceMappingURL=provider-registry.service.js.map