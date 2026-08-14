"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const kb_ingestion_service_1 = require("../knowledge-base/kb-ingestion.service");
/** Standalone knowledge-base (re)ingestion entrypoint. */
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: ['log', 'warn', 'error'] });
    await app.get(kb_ingestion_service_1.KbIngestionService).ingestAll();
    new common_1.Logger('Ingest').log('Knowledge base ingestion complete');
    await app.close();
}
void main();
//# sourceMappingURL=ingest.js.map