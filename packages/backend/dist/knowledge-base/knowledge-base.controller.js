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
exports.KnowledgeBaseController = void 0;
const common_1 = require("@nestjs/common");
const api_key_guard_1 = require("../auth/api-key.guard");
const kb_index_service_1 = require("./kb-index.service");
const kb_ingestion_service_1 = require("./kb-ingestion.service");
let KnowledgeBaseController = class KnowledgeBaseController {
    kbIndex;
    ingestion;
    constructor(kbIndex, ingestion) {
        this.kbIndex = kbIndex;
        this.ingestion = ingestion;
    }
    /** Selectable knowledge-base groups for the client dropdown. */
    list() {
        return this.kbIndex.groups().map((g) => ({
            ...g,
            documentCount: this.kbIndex.documentsForGroup(g.id).length,
            ingested: this.ingestion.isIngested(g.id),
        }));
    }
};
exports.KnowledgeBaseController = KnowledgeBaseController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], KnowledgeBaseController.prototype, "list", null);
exports.KnowledgeBaseController = KnowledgeBaseController = __decorate([
    (0, common_1.Controller)('knowledge-bases'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [kb_index_service_1.KbIndexService,
        kb_ingestion_service_1.KbIngestionService])
], KnowledgeBaseController);
//# sourceMappingURL=knowledge-base.controller.js.map