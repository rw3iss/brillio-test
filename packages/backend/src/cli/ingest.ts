import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { KbIngestionService } from '../knowledge-base/kb-ingestion.service';

/** Standalone knowledge-base (re)ingestion entrypoint. */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  await app.get(KbIngestionService).ingestAll();
  new Logger('Ingest').log('Knowledge base ingestion complete');
  await app.close();
}

void main();
