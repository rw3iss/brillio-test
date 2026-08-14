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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderRouter = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const provider_registry_service_1 = require("./provider-registry.service");
/** Chooses providers and computes fallback order when one is unavailable. */
let ProviderRouter = class ProviderRouter {
    registry;
    config;
    constructor(registry, config) {
        this.registry = registry;
        this.config = config;
    }
    /**
     * Ordered candidate list starting with the requested provider, then the
     * remaining available providers (config order), and finally mock as a
     * guaranteed offline fallback. Never empty.
     */
    fallbackOrder(desired) {
        const order = [
            desired,
            ...this.config.providers.map((p) => p.id).filter((id) => id !== desired),
        ];
        const seen = new Set();
        const result = [];
        for (const id of order) {
            if (seen.has(id))
                continue;
            seen.add(id);
            const adapter = this.registry.get(id);
            if (adapter?.isAvailable())
                result.push(adapter);
        }
        // Mock is always available; guarantee at least one candidate.
        if (result.length === 0) {
            const mock = this.registry.get('mock');
            if (mock)
                result.push(mock);
        }
        return result;
    }
    contextWindow(id) {
        return this.config.getProvider(id)?.contextWindow ?? 128000;
    }
    pricing(id) {
        return this.config.getProvider(id)?.pricing ?? { inputPer1M: 0, outputPer1M: 0, currency: 'USD' };
    }
};
exports.ProviderRouter = ProviderRouter;
exports.ProviderRouter = ProviderRouter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [provider_registry_service_1.ProviderRegistry,
        config_service_1.AppConfigService])
], ProviderRouter);
//# sourceMappingURL=provider-router.service.js.map