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
exports.SessionRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("./db.service");
/** Persistence boundary for sessions (swap this impl to change storage). */
let SessionRepository = class SessionRepository {
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    upsert(session) {
        this.dbService.db
            .prepare(`INSERT INTO sessions (id,userId,knowledgeBaseId,provider,systemPrompt,title,createdAt,updatedAt,messages)
         VALUES (@id,@userId,@knowledgeBaseId,@provider,@systemPrompt,@title,@createdAt,@updatedAt,@messages)
         ON CONFLICT(id) DO UPDATE SET
           knowledgeBaseId=excluded.knowledgeBaseId,
           provider=excluded.provider,
           systemPrompt=excluded.systemPrompt,
           title=excluded.title,
           updatedAt=excluded.updatedAt,
           messages=excluded.messages`)
            .run({
            ...session,
            messages: JSON.stringify(session.messages),
        });
    }
    findById(id) {
        const row = this.dbService.db
            .prepare('SELECT * FROM sessions WHERE id = ?')
            .get(id);
        return row ? this.hydrate(row) : undefined;
    }
    listByUser(userId) {
        const rows = this.dbService.db
            .prepare('SELECT * FROM sessions WHERE userId = ? ORDER BY updatedAt DESC')
            .all(userId);
        return rows.map((r) => {
            const s = this.hydrate(r);
            return {
                id: s.id,
                userId: s.userId,
                knowledgeBaseId: s.knowledgeBaseId,
                provider: s.provider,
                title: s.title,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                messageCount: s.messages.length,
            };
        });
    }
    hydrate(row) {
        return {
            id: row.id,
            userId: row.userId,
            knowledgeBaseId: row.knowledgeBaseId,
            provider: row.provider,
            systemPrompt: row.systemPrompt,
            title: row.title,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            messages: JSON.parse(row.messages),
        };
    }
};
exports.SessionRepository = SessionRepository;
exports.SessionRepository = SessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], SessionRepository);
//# sourceMappingURL=session.repository.js.map