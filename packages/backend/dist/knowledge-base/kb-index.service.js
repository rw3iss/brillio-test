"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KbIndexService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KbIndexService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const paths_1 = require("../config/paths");
/** Loads knowledge-base/index.json and answers questions about groups/docs. */
let KbIndexService = KbIndexService_1 = class KbIndexService {
    logger = new common_1.Logger(KbIndexService_1.name);
    index = { groups: [], documents: [] };
    load() {
        const path = (0, paths_1.kbIndexPath)();
        this.index = JSON.parse((0, node_fs_1.readFileSync)(path, 'utf-8'));
        this.logger.log(`Loaded KB index: ${this.index.groups.length} groups, ${this.index.documents.length} documents`);
    }
    groups() {
        return this.index.groups;
    }
    hasGroup(id) {
        return this.index.groups.some((g) => g.id === id);
    }
    documents() {
        return this.index.documents;
    }
    documentsForGroup(groupId) {
        return this.index.documents.filter((d) => d.groups.includes(groupId));
    }
};
exports.KbIndexService = KbIndexService;
exports.KbIndexService = KbIndexService = KbIndexService_1 = __decorate([
    (0, common_1.Injectable)()
], KbIndexService);
//# sourceMappingURL=kb-index.service.js.map