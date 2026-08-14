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
var AppConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const paths_1 = require("./paths");
/** Loads and exposes the static app configuration read at runtime. */
let AppConfigService = AppConfigService_1 = class AppConfigService {
    logger = new common_1.Logger(AppConfigService_1.name);
    config;
    constructor() {
        const path = (0, paths_1.configPath)();
        this.config = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf-8'));
        this.logger.log(`Loaded config from ${path} (${this.config.providers.length} providers)`);
    }
    get raw() {
        return this.config;
    }
    get port() {
        return Number(process.env.PORT ?? this.config.server.port);
    }
    get corsOrigins() {
        return this.config.server.corsOrigins;
    }
    get apiKeys() {
        return this.config.auth.apiKeys;
    }
    get defaultProvider() {
        return this.config.defaults.provider;
    }
    get rag() {
        return this.config.rag;
    }
    get warnings() {
        return this.config.warnings;
    }
    get providers() {
        return this.config.providers;
    }
    getProvider(id) {
        return this.config.providers.find((p) => p.id === id);
    }
    /** Resolve a system prompt: explicit override, or a named ref, or the default. */
    resolveSystemPrompt(override, ref) {
        if (override && override.trim())
            return override;
        const key = ref ?? this.config.defaults.systemPromptRef;
        return this.config.systemPrompts[key] ?? this.config.systemPrompts.default ?? '';
    }
    /** API key value for a provider from its configured env var, if present. */
    providerApiKey(id) {
        const cfg = this.getProvider(id);
        if (!cfg || !cfg.apiKeyEnv)
            return undefined;
        const val = process.env[cfg.apiKeyEnv];
        return val && val.trim() ? val : undefined;
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = AppConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppConfigService);
//# sourceMappingURL=config.service.js.map