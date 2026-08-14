import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Walk up from a starting dir until a marker path exists; returns the dir. */
function findUp(marker: string, start: string = process.cwd()): string {
  let dir = start;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (existsSync(resolve(dir, marker))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate "${marker}" walking up from ${start}`);
}

/** Monorepo root (the directory that holds config/app.config.json). */
export function repoRoot(): string {
  if (process.env.BRILLIO_ROOT) return process.env.BRILLIO_ROOT;
  return findUp('config/app.config.json');
}

export function configPath(): string {
  return process.env.BRILLIO_CONFIG ?? resolve(repoRoot(), 'config/app.config.json');
}

export function knowledgeBaseRoot(): string {
  return process.env.BRILLIO_KB ?? resolve(repoRoot(), 'knowledge-base');
}

export function kbIndexPath(): string {
  return resolve(knowledgeBaseRoot(), 'index.json');
}

export function dataDir(): string {
  return process.env.BRILLIO_DATA ?? resolve(repoRoot(), '.data');
}
