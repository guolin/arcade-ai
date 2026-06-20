import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, run } from '../src/cli.js';

test('parseArgs 解析命令与选项', () => {
  const r = parseArgs(['init', 'my-game', '--tool', 'claude']);
  assert.equal(r.command, 'init');
  assert.deepEqual(r.positionals, ['my-game']);
  assert.equal(r.options.tool, 'claude');
});

test('run 未知命令返回退出码 1', async () => {
  const code = await run(['frobnicate']);
  assert.equal(code, 1);
});

test('run 无命令打印帮助返回 0', async () => {
  const code = await run([]);
  assert.equal(code, 0);
});
