"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const auth_module_1 = require("./auth/auth.module");
const persistence_module_1 = require("./persistence/persistence.module");
const providers_module_1 = require("./providers/providers.module");
const knowledge_base_module_1 = require("./knowledge-base/knowledge-base.module");
const session_module_1 = require("./session/session.module");
const usage_module_1 = require("./usage/usage.module");
const chat_module_1 = require("./chat/chat.module");
const transport_module_1 = require("./transport/transport.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            auth_module_1.AuthModule,
            persistence_module_1.PersistenceModule,
            providers_module_1.ProvidersModule,
            knowledge_base_module_1.KnowledgeBaseModule,
            session_module_1.SessionModule,
            usage_module_1.UsageModule,
            chat_module_1.ChatModule,
            transport_module_1.TransportModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map