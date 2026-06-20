import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const PROJECT_FILES = ['README.md', 'main.ts', 'main.blocks', 'pxt.json', 'assets.json', 'test.ts'];

export function readProject(gameDir) {
  const out = {};
  for (const f of PROJECT_FILES) {
    const p = join(gameDir, f);
    if (existsSync(p)) out[f] = readFileSync(p, 'utf8');
  }
  return out;
}

export function writeProject(gameDir, files, opts = {}) {
  const written = [];
  for (const f of Object.keys(files || {})) {
    if (!PROJECT_FILES.includes(f)) continue;
    opts.beforeWrite?.();
    writeFileSync(join(gameDir, f), files[f] ?? '', 'utf8');
    written.push(f);
  }
  return written;
}
