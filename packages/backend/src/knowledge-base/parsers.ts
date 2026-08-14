import { readFile } from 'node:fs/promises';
import type { KbDocumentType } from '@brillio/shared';

/** Extract plain text from a source document by type. */
export async function parseDocument(path: string, type: KbDocumentType): Promise<string> {
  switch (type) {
    case 'markdown':
      return stripMarkdown(await readFile(path, 'utf-8'));
    case 'json':
      return jsonToText(await readFile(path, 'utf-8'));
    case 'pdf':
      return parsePdf(path);
    default:
      return '';
  }
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function jsonToText(raw: string): string {
  try {
    const data = JSON.parse(raw);
    return flatten(data).join('\n');
  } catch {
    return raw;
  }
}

/** Flatten arbitrary JSON into "key: value" lines for retrieval. */
function flatten(value: unknown, prefix = ''): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => flatten(v, prefix ? `${prefix}[${i}]` : `${i}`));
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      flatten(v, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [`${prefix}: ${String(value)}`];
}

async function parsePdf(path: string): Promise<string> {
  // unpdf bundles a modern pdf.js build; robust against varied PDF producers.
  const { extractText, getDocumentProxy } = await import('unpdf');
  const buffer = await readFile(path);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join('\n') : text).trim();
}
