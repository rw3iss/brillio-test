"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const paths_1 = require("../config/paths");
/** Owns the SQLite connection and schema. Repositories depend on this. */
let DbService = DbService_1 = class DbService {
    logger = new common_1.Logger(DbService_1.name);
    database;
    onModuleInit() {
        const dir = (0, paths_1.dataDir)();
        (0, node_fs_1.mkdirSync)(dir, { recursive: true });
        const file = (0, node_path_1.resolve)(dir, 'brillio.sqlite');
        this.database = new better_sqlite3_1.default(file);
        this.database.pragma('journal_mode = WAL');
        this.migrate();
        this.logger.log(`SQLite ready at ${file}`);
    }
    onModuleDestroy() {
        this.database?.close();
    }
    get db() {
        return this.database;
    }
    migrate() {
        this.database.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        knowledgeBaseId TEXT NOT NULL,
        provider TEXT NOT NULL,
        systemPrompt TEXT NOT NULL,
        title TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        messages TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);

      CREATE TABLE IF NOT EXISTS usage_records (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        knowledgeBaseId TEXT NOT NULL,
        question TEXT NOT NULL,
        inputTokens INTEGER NOT NULL,
        outputTokens INTEGER NOT NULL,
        cost REAL NOT NULL,
        latencyMs INTEGER NOT NULL,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_usage_session ON usage_records(sessionId);
      CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_records(userId);
      CREATE INDEX IF NOT EXISTS idx_usage_provider ON usage_records(provider);
    `);
    }
};
exports.DbService = DbService;
exports.DbService = DbService = DbService_1 = __decorate([
    (0, common_1.Injectable)()
], DbService);
//# sourceMappingURL=db.service.js.map