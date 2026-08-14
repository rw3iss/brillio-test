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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../auth/api-key.guard");
const usage_service_1 = require("./usage.service");
let UsageController = class UsageController {
    usage;
    constructor(usage) {
        this.usage = usage;
    }
    /** Aggregated usage for a user / session / provider / whole system. */
    aggregate(scope = 'system', key = '') {
        const validScopes = ['user', 'session', 'provider', 'system'];
        const s = validScopes.includes(scope) ? scope : 'system';
        return this.usage.aggregate(s, key);
    }
};
exports.UsageController = UsageController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('scope')),
    __param(1, (0, common_1.Query)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], UsageController.prototype, "aggregate", null);
exports.UsageController = UsageController = __decorate([
    (0, common_1.Controller)('usage'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [usage_service_1.UsageService])
], UsageController);
//# sourceMappingURL=usage.controller.js.map