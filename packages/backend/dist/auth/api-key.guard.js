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
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@brillio/shared");
const api_key_service_1 = require("./api-key.service");
/** Guards REST routes by validating the x-api-key header (or ?apiKey= for SSE GETs). */
let ApiKeyGuard = class ApiKeyGuard {
    apiKeys;
    constructor(apiKeys) {
        this.apiKeys = apiKeys;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const headerKey = req.header(shared_1.API_KEY_HEADER);
        const queryKey = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;
        const bodyKey = req.body && typeof req.body.apiKey === 'string'
            ? req.body.apiKey
            : undefined;
        const key = headerKey ?? queryKey ?? bodyKey;
        if (!this.apiKeys.isValid(key)) {
            throw new common_1.UnauthorizedException('Invalid or missing API key');
        }
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_key_service_1.ApiKeyService])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map