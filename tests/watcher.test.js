import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWatcher } from '../src/studio/watcher.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('文件变化触发 onChange', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aca-w-'));
  let hits = 0;
  const w = createWatcher(dir, () => hits++);
  await wait(300);                     // 等 chokidar ready
  await writeFile(join(dir, 'main.ts'), 'v1');
  await wait(500);
  assert.ok(hits >= 1, `期望至少 1 次，实际 ${hits}`);
  await w.close();
});

test('pause 期间忽略变化', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aca-w2-'));
  let hits = 0;
  const w = createWatcher(dir, () => hits++);
  await wait(300);
  w.pause(600);
  await writeFile(join(dir, 'main.ts'), 'v2');
  await wait(400);
  assert.equal(hits, 0);
  await w.close();
});
