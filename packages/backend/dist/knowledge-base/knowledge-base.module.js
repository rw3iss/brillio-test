"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseModule = void 0;
const common_1 = require("@nestjs/common");
const kb_index_service_1 = require("./kb-index.service");
const kb_ingestion_service_1 = require("./kb-ingestion.service");
const rag_service_1 = require("./rag.service");
const knowledge_base_controller_1 = require("./knowledge-base.controller");
let KnowledgeBaseModule = class KnowledgeBaseModule {
};
exports.KnowledgeBaseModule = KnowledgeBaseModule;
exports.KnowledgeBaseModule = KnowledgeBaseModule = __decorate([
    (0, common_1.Module)({
        controllers: [knowledge_base_controller_1.KnowledgeBaseController],
        providers: [kb_index_service_1.KbIndexService, kb_ingestion_service_1.KbIngestionService, rag_service_1.RagService],
        exports: [kb_index_service_1.KbIndexService, kb_ingestion_service_1.KbIngestionService, rag_service_1.RagService],
    })
], KnowledgeBaseModule);
//# sourceMappingURL=knowledge-base.module.js.map