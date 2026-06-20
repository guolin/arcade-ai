import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import runInit from '../src/commands/init.js';

test('init 生成 game 目录且固化四个坑', async () => {
  const base = await mkdtemp(join(tmpdir(), 'aca-init-'));
  const dest = join(base, 'my-game');
  const code = await runInit({ positionals: [dest], options: {} });
  assert.equal(code, 0);

  const pxt = JSON.parse(await readFile(join(dest, 'game/pxt.json'), 'utf8'));
  for (const f of ['README.md','main.ts','main.blocks','assets.json']) {
    assert.ok(pxt.files.includes(f), `pxt.json files 缺 ${f}`);   // 坑2
  }
  const assets = await readFile(join(dest, 'game/assets.json'), 'utf8');
  assert.equal(assets.trim(), '{}');                              // 坑1
  await readFile(join(dest, 'game/main.ts'), 'utf8');             // 存在即可
  await readFile(join(dest, 'package.json'), 'utf8');
});
