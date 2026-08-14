import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { dataDir } from '../config/paths';

/** Owns the SQLite connection and schema. Repositories depend on this. */
@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DbService.name);
  private database!: Database.Database;

  onModuleInit(): void {
    const dir = dataDir();
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, 'brillio.sqlite');
    this.database = new Database(file);
    this.database.pragma('journal_mode = WAL');
    this.migrate();
    this.logger.log(`SQLite ready at ${file}`);
  }

  onModuleDestroy(): void {
    this.database?.close();
  }

  get db(): Database.Database {
    return this.database;
  }

  private migrate(): void {
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
}
