import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractId } from '../src/commands/clone.js';

test('extractId 解析各种 URL 格式', () => {
  assert.equal(extractId('https://makecode.com/_hfq2dmf99djR'), '_hfq2dmf99djR');
  assert.equal(extractId('https://arcade.makecode.com/96398-07059-89709-85769'), '96398-07059-89709-85769');
  assert.equal(extractId('https://makecode.com/api/12345-67890'), '12345-67890');
  assert.equal(extractId('96398-07059-89709-85769'), '96398-07059-89709-85769');
});

test('clone blocks 项目（网络）', { skip: !process.env.CI_NET }, async () => {
  const { default: clone } = await import('../src/commands/clone.js');
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { readFileSync, existsSync } = await import('node:fs');

  const base = await mkdtemp(join(tmpdir(), 'aca-clone-'));
  const dest = join(base, 'out');
  const code = await clone({ positionals: ['https://makecode.com/_hfq2dmf99djR', dest], options: {} });
  assert.equal(code, 0);

  // main.blocks 不得存在
  assert.ok(!existsSync(join(dest, 'game', 'main.blocks')), 'main.blocks 不应存在');
  // main.ts 存在
  assert.ok(existsSync(join(dest, 'game', 'main.ts')), 'main.ts 应存在');
  // pxt.json preferredEditor 已修正
  const pxt = JSON.parse(readFileSync(join(dest, 'game', 'pxt.json'), 'utf8'));
  assert.equal(pxt.preferredEditor, 'tsprj');
  assert.ok(!pxt.files.includes('main.blocks'), 'files[] 不应含 main.blocks');
  assert.ok(!pxt.targetVersions, 'targetVersions 应已删除');
});
