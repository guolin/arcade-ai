import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference');

test('四份参考文档存在且非空', () => {
  for (const f of ['arcade-api.md','limits.md','pitfalls.md','project-format.md']) {
    const p = join(dir, f);
    assert.ok(existsSync(p), `缺 ${f}`);
    assert.ok(readFileSync(p, 'utf8').trim().length > 50, `${f} 太短`);
  }
});

test('pitfalls.md 覆盖四个坑', () => {
  const t = readFileSync(join(dir, 'pitfalls.md'), 'utf8');
  for (const kw of ['assets.json', 'files', 'blocksprj', 'controller=1']) {
    assert.ok(t.includes(kw), `pitfalls 缺关键词 ${kw}`);
  }
});
