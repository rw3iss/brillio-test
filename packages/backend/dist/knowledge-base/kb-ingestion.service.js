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
var KbIngestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KbIngestionService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const config_service_1 = require("../config/config.service");
const paths_1 = require("../config/paths");
const kb_index_service_1 = require("./kb-index.service");
const parsers_1 = require("./parsers");
const bm25_1 = require("./bm25");
/**
 * On startup (and on demand) ensures every knowledge-base group has a parsed,
 * chunked, indexed representation. Parsed text is cached on disk keyed by file
 * mtime+size so unchanged documents are not re-parsed; new/changed documents
 * are (re)ingested automatically.
 */
let KbIngestionService = KbIngestionService_1 = class KbIngestionService {
    config;
    kbIndex;
    logger = new common_1.Logger(KbIngestionService_1.name);
    indexes = new Map();
    ingestedGroups = new Set();
    cacheDir = (0, node_path_1.resolve)((0, paths_1.dataDir)(), 'kb-cache');
    constructor(config, kbIndex) {
        this.config = config;
        this.kbIndex = kbIndex;
    }
    async onModuleInit() {
        (0, node_fs_1.mkdirSync)(this.cacheDir, { recursive: true });
        this.kbIndex.load();
        await this.ingestAll();
    }
    async ingestAll() {
        for (const group of this.kbIndex.groups()) {
            await this.ingestGroup(group.id);
        }
    }
    isIngested(groupId) {
        return this.ingestedGroups.has(groupId);
    }
    getIndex(groupId) {
        return this.indexes.get(groupId);
    }
    async ingestGroup(groupId) {
        const docs = this.kbIndex.documentsForGroup(groupId);
        const index = new bm25_1.Bm25Index();
        const { chunkSize, chunkOverlap } = this.config.rag;
        for (const doc of docs) {
            try {
                const text = await this.loadDocumentText(doc);
                const chunks = this.chunk(text, doc, chunkSize, chunkOverlap);
                for (const c of chunks)
                    index.add(c);
            }
            catch (err) {
                this.logger.warn(`Failed to ingest ${doc.path}: ${err.message}`);
            }
        }
        this.indexes.set(groupId, index);
        this.ingestedGroups.add(groupId);
        this.logger.log(`Ingested group "${groupId}": ${docs.length} docs → ${index.size} chunks`);
    }
    /** Parse a document, using a mtime+size keyed on-disk cache. */
    async loadDocumentText(doc) {
        const abs = (0, node_path_1.resolve)((0, paths_1.repoRoot)(), doc.path);
        const stat = (0, node_fs_1.statSync)(abs);
        const stamp = `${stat.size}-${Math.round(stat.mtimeMs)}`;
        const cacheFile = (0, node_path_1.resolve)(this.cacheDir, `${doc.id}.json`);
        if ((0, node_fs_1.existsSync)(cacheFile)) {
            try {
                const cached = JSON.parse((0, node_fs_1.readFileSync)(cacheFile, 'utf-8'));
                if (cached.stamp === stamp)
                    return cached.text;
            }
            catch {
                /* fall through to re-parse */
            }
        }
        const text = await (0, parsers_1.parseDocument)(abs, doc.type);
        (0, node_fs_1.writeFileSync)(cacheFile, JSON.stringify({ stamp, text }), 'utf-8');
        return text;
    }
    /** Paragraph-aware sliding window chunker. */
    chunk(text, doc, size, overlap) {
        const clean = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
        if (!clean)
            return [];
        const paras = clean.split(/\n\n+/);
        const chunks = [];
        let buffer = '';
        let n = 0;
        const flush = () => {
            const body = buffer.trim();
            if (body.length < 20)
                return;
            chunks.push({
                id: `${doc.id}#${n++}`,
                documentId: doc.id,
                documentName: doc.name,
                text: body,
            });
        };
        for (const para of paras) {
            if ((buffer + '\n\n' + para).length > size && buffer) {
                flush();
                buffer = overlap > 0 ? buffer.slice(-overlap) + '\n\n' + para : para;
            }
            else {
                buffer = buffer ? `${buffer}\n\n${para}` : para;
            }
        }
        flush();
        return chunks;
    }
};
exports.KbIngestionService = KbIngestionService;
exports.KbIngestionService = KbIngestionService = KbIngestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.AppConfigService,
        kb_index_service_1.KbIndexService])
], KbIngestionService);
//# sourceMappingURL=kb-ingestion.service.js.map