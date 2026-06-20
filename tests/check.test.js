import { test } from 'node:test';
import assert from 'node:assert/strict';
import runCheck from '../src/commands/check.js';

test('check 对官方编辑器握手成功', { skip: !process.env.ACA_E2E }, async () => {
  const code = await runCheck({ positionals: [], options: {} });
  assert.equal(code, 0);
});
