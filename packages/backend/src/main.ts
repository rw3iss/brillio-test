import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { repoRoot } from './config/paths';

// Load provider API keys from the repo-root .env before anything reads process.env.
loadEnv({ path: resolve(repoRoot(), '.env') });

import type { Server } from 'node:http';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { WsGateway } from './transport/ws.gateway';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(AppConfigService);

  app.enableCors({
    origin: config.corsOrigins.length ? config.corsOrigins : true,
    allowedHeaders: ['content-type', 'x-api-key'],
  });
  await app.init();

  const server = app.getHttpServer() as Server;
  app.get(WsGateway).bind(server);

  await app.listen(config.port);
  new Logger('Bootstrap').log(`Brillio backend listening on http://localhost:${config.port}`);
}

void bootstrap();
