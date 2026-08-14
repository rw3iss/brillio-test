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
var UsageRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("./db.service");
/** Persistence boundary for usage records + aggregates. */
let UsageRepository = class UsageRepository {
    static { UsageRepository_1 = this; }
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    insert(record) {
        this.dbService.db
            .prepare(`INSERT INTO usage_records
          (id,sessionId,userId,provider,model,knowledgeBaseId,question,inputTokens,outputTokens,cost,latencyMs,createdAt)
         VALUES
          (@id,@sessionId,@userId,@provider,@model,@knowledgeBaseId,@question,@inputTokens,@outputTokens,@cost,@latencyMs,@createdAt)`)
            .run(record);
    }
    static COLUMN = {
        user: 'userId',
        session: 'sessionId',
        provider: 'provider',
    };
    aggregate(scope, key) {
        const base = 'SELECT COUNT(*) AS requests, COALESCE(SUM(inputTokens),0) AS inputTokens, ' +
            'COALESCE(SUM(outputTokens),0) AS outputTokens, COALESCE(SUM(cost),0) AS totalCost FROM usage_records';
        let row;
        if (scope === 'system') {
            row = this.dbService.db.prepare(base).get();
        }
        else {
            const col = UsageRepository_1.COLUMN[scope];
            row = this.dbService.db.prepare(`${base} WHERE ${col} = ?`).get(key);
        }
        return {
            scope,
            key: scope === 'system' ? 'system' : key,
            requests: row.requests,
            inputTokens: row.inputTokens,
            outputTokens: row.outputTokens,
            totalCost: Math.round(row.totalCost * 1_000_000) / 1_000_000,
        };
    }
    /** Session-scoped token totals used for live context accounting. */
    sessionTotals(sessionId) {
        const row = this.dbService.db
            .prepare('SELECT COALESCE(SUM(inputTokens),0) AS inputTokens, COALESCE(SUM(outputTokens),0) AS outputTokens, COALESCE(SUM(cost),0) AS cost FROM usage_records WHERE sessionId = ?')
            .get(sessionId);
        return row;
    }
};
exports.UsageRepository = UsageRepository;
exports.UsageRepository = UsageRepository = UsageRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], UsageRepository);
//# sourceMappingURL=usage.repository.js.map