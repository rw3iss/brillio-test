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
exports.UsageService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const usage_repository_1 = require("../persistence/usage.repository");
/** Records per-request token/cost usage and exposes rolled-up aggregates. */
let UsageService = class UsageService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    record(input) {
        const record = {
            ...input,
            id: (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
        };
        this.repo.insert(record);
        return record;
    }
    aggregate(scope, key) {
        return this.repo.aggregate(scope, key);
    }
    sessionTotals(sessionId) {
        return this.repo.sessionTotals(sessionId);
    }
};
exports.UsageService = UsageService;
exports.UsageService = UsageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [usage_repository_1.UsageRepository])
], UsageService);
//# sourceMappingURL=usage.service.js.map