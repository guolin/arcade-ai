import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readProject, writeProject, PROJECT_FILES } from '../src/project-io.js';

async function tmp() { return mkdtemp(join(tmpdir(), 'aca-')); }

test('readProject 只返回存在的白名单文件', async () => {
  const dir = await tmp();
  await writeFile(join(dir, 'main.ts'), 'let x = 1');
  await writeFile(join(dir, 'secret.env'), 'NOPE');
  const files = readProject(dir);
  assert.equal(files['main.ts'], 'let x = 1');
  assert.ok(!('secret.env' in files));
});

test('writeProject 过滤非白名单并回调 beforeWrite', async () => {
  const dir = await tmp();
  let calls = 0;
  const written = writeProject(dir, { 'main.ts': 'A', 'evil.sh': 'rm' }, { beforeWrite: () => calls++ });
  assert.deepEqual(written, ['main.ts']);
  assert.equal(calls, 1);
  assert.equal(await readFile(join(dir, 'main.ts'), 'utf8'), 'A');
});

test('PROJECT_FILES 含四坑约束文件', () => {
  for (const f of ['README.md','main.ts','main.blocks','pxt.json','assets.json']) {
    assert.ok(PROJECT_FILES.includes(f), `缺 ${f}`);
  }
});
