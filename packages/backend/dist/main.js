"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const node_path_1 = require("node:path");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const paths_1 = require("./config/paths");
// Load provider API keys from the repo-root .env before anything reads process.env.
(0, dotenv_1.config)({ path: (0, node_path_1.resolve)((0, paths_1.repoRoot)(), '.env') });
const app_module_1 = require("./app.module");
const config_service_1 = require("./config/config.service");
const ws_gateway_1 = require("./transport/ws.gateway");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: false });
    const config = app.get(config_service_1.AppConfigService);
    app.enableCors({
        origin: config.corsOrigins.length ? config.corsOrigins : true,
        allowedHeaders: ['content-type', 'x-api-key'],
    });
    await app.init();
    const server = app.getHttpServer();
    app.get(ws_gateway_1.WsGateway).bind(server);
    await app.listen(config.port);
    new common_1.Logger('Bootstrap').log(`Brillio backend listening on http://localhost:${config.port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map