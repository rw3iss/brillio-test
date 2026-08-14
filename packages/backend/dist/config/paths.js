"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repoRoot = repoRoot;
exports.configPath = configPath;
exports.knowledgeBaseRoot = knowledgeBaseRoot;
exports.kbIndexPath = kbIndexPath;
exports.dataDir = dataDir;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
/** Walk up from a starting dir until a marker path exists; returns the dir. */
function findUp(marker, start = process.cwd()) {
    let dir = start;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(dir, marker)))
            return dir;
        const parent = (0, node_path_1.dirname)(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    throw new Error(`Could not locate "${marker}" walking up from ${start}`);
}
/** Monorepo root (the directory that holds config/app.config.json). */
function repoRoot() {
    if (process.env.BRILLIO_ROOT)
        return process.env.BRILLIO_ROOT;
    return findUp('config/app.config.json');
}
function configPath() {
    return process.env.BRILLIO_CONFIG ?? (0, node_path_1.resolve)(repoRoot(), 'config/app.config.json');
}
function knowledgeBaseRoot() {
    return process.env.BRILLIO_KB ?? (0, node_path_1.resolve)(repoRoot(), 'knowledge-base');
}
function kbIndexPath() {
    return (0, node_path_1.resolve)(knowledgeBaseRoot(), 'index.json');
}
function dataDir() {
    return process.env.BRILLIO_DATA ?? (0, node_path_1.resolve)(repoRoot(), '.data');
}
//# sourceMappingURL=paths.js.map