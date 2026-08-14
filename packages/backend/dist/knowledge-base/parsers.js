"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocument = parseDocument;
const promises_1 = require("node:fs/promises");
/** Extract plain text from a source document by type. */
async function parseDocument(path, type) {
    switch (type) {
        case 'markdown':
            return stripMarkdown(await (0, promises_1.readFile)(path, 'utf-8'));
        case 'json':
            return jsonToText(await (0, promises_1.readFile)(path, 'utf-8'));
        case 'pdf':
            return parsePdf(path);
        default:
            return '';
    }
}
function stripMarkdown(md) {
    return md
        .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[*_>`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
}
function jsonToText(raw) {
    try {
        const data = JSON.parse(raw);
        return flatten(data).join('\n');
    }
    catch {
        return raw;
    }
}
/** Flatten arbitrary JSON into "key: value" lines for retrieval. */
function flatten(value, prefix = '') {
    if (value === null || value === undefined)
        return [];
    if (Array.isArray(value)) {
        return value.flatMap((v, i) => flatten(v, prefix ? `${prefix}[${i}]` : `${i}`));
    }
    if (typeof value === 'object') {
        return Object.entries(value).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
    }
    return [`${prefix}: ${String(value)}`];
}
async function parsePdf(path) {
    // unpdf bundles a modern pdf.js build; robust against varied PDF producers.
    const { extractText, getDocumentProxy } = await Promise.resolve().then(() => __importStar(require('unpdf')));
    const buffer = await (0, promises_1.readFile)(path);
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join('\n') : text).trim();
}
//# sourceMappingURL=parsers.js.map