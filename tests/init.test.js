import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import runInit from '../src/commands/init.js';

test('init 生成纯 TS 项目（真机验证后的正确格式）', async () => {
  const base = await mkdtemp(join(tmpdir(), 'aca-init-'));
  const dest = join(base, 'my-game');
  const code = await runInit({ positionals: [dest], options: {} });
  assert.equal(code, 0);

  const pxt = JSON.parse(await readFile(join(dest, 'game/pxt.json'), 'utf8'));
  // 纯 TS 工作流：files 必须含 main.ts，且不得含 main.blocks（否则编辑器开在空白积木视图）
  for (const f of ['main.ts','README.md','assets.json']) {
    assert.ok(pxt.files.includes(f), `pxt.json files 缺 ${f}`);
  }
  assert.ok(!pxt.files.includes('main.blocks'), 'files 不应含 main.blocks（纯 TS 项目）');
  assert.equal(pxt.preferredEditor, 'tsprj', 'preferredEditor 应为 tsprj');
  const assets = await readFile(join(dest, 'game/assets.json'), 'utf8');
  assert.equal(assets.trim(), '{}');                              // 空资源必须是合法 {}
  await readFile(join(dest, 'game/main.ts'), 'utf8');             // 存在即可
  await readFile(join(dest, 'package.json'), 'utf8');
  // 知识库被拷进项目，项目自包含
  await readFile(join(dest, 'reference/arcade-api.md'), 'utf8');
  await readFile(join(dest, 'reference/pitfalls.md'), 'utf8');
});

import { stat } from 'node:fs/promises';

test('init --tool claude 写 CLAUDE.md', async () => {
  const base = await mkdtemp(join(tmpdir(), 'aca-tool-'));
  const dest = join(base, 'g');
  await runInit({ positionals: [dest], options: { tool: 'claude' } });
  await stat(join(dest, 'CLAUDE.md'));
});

test('init 默认写 AGENTS.md', async () => {
  const base = await mkdtemp(join(tmpdir(), 'aca-tool2-'));
  const dest = join(base, 'g');
  await runInit({ positionals: [dest], options: {} });
  await stat(join(dest, 'AGENTS.md'));
});

test('init --tool trae 写 .trae/project_rules.md', async () => {
  const base = await mkdtemp(join(tmpdir(), 'aca-tool3-'));
  const dest = join(base, 'g');
  await runInit({ positionals: [dest], options: { tool: 'trae' } });
  await stat(join(dest, '.trae/project_rules.md'));
});
