import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readProject, writeProject, isSyncable } from '../src/project-io.js';

async function tmp() { return mkdtemp(join(tmpdir(), 'aca-')); }

test('readProject 读所有项目文件，排除非项目扩展与目录', async () => {
  const dir = await tmp();
  await writeFile(join(dir, 'main.ts'), 'let x = 1');
  await writeFile(join(dir, 'tilemap.g.ts'), '// generated');   // 动态生成文件也要读
  await writeFile(join(dir, 'tiles.g.jres'), '{}');
  await writeFile(join(dir, 'secret.env'), 'NOPE');             // 非项目扩展，排除
  await mkdir(join(dir, 'pxt_modules'));                        // 目录，跳过
  await writeFile(join(dir, 'pxt_modules', 'x.ts'), 'dep');
  const files = readProject(dir);
  assert.equal(files['main.ts'], 'let x = 1');
  assert.equal(files['tilemap.g.ts'], '// generated');
  assert.equal(files['tiles.g.jres'], '{}');
  assert.ok(!('secret.env' in files));
  assert.ok(!('pxt_modules' in files));
});

test('writeProject 允许地图生成文件、拒绝危险文件，回调 beforeWrite', async () => {
  const dir = await tmp();
  let calls = 0;
  const written = writeProject(dir, {
    'main.ts': 'A',
    'tilemap.g.ts': 'T',     // tilemap 生成文件：必须能落盘（旧白名单会丢）
    'tiles.g.jres': '{}',
    'evil.sh': 'rm -rf',     // 危险扩展：拒绝
  }, { beforeWrite: () => calls++ });
  assert.ok(written.includes('main.ts'));
  assert.ok(written.includes('tilemap.g.ts'));
  assert.ok(written.includes('tiles.g.jres'));
  assert.ok(!written.includes('evil.sh'));
  assert.equal(calls, written.length);
  assert.equal(await readFile(join(dir, 'tilemap.g.ts'), 'utf8'), 'T');
});

test('writeProject 拒绝路径遍历，不写到目录外', async () => {
  const dir = await tmp();
  const written = writeProject(dir, {
    '../escape.ts': 'X',
    'sub/nested.ts': 'Y',
    '/abs.ts': 'Z',
  });
  assert.deepEqual(written, []);
  assert.ok(!existsSync(join(dir, '..', 'escape.ts')));
});

test('isSyncable：扩展白名单 + 防遍历 + 排除隐藏文件', () => {
  assert.ok(isSyncable('main.ts'));
  assert.ok(isSyncable('tilemap.g.ts'));
  assert.ok(isSyncable('tilemap.g.jres'));
  assert.ok(isSyncable('images.g.ts'));
  assert.ok(isSyncable('tiles.g.jres'));
  assert.ok(isSyncable('assets.json'));
  assert.ok(isSyncable('_palettes.json'));     // 自定义调色板，下划线开头但非隐藏
  assert.ok(isSyncable('README.md'));
  assert.ok(!isSyncable('main.py'));           // 纯 JS 工具：不同步 Python 转译产物
  assert.ok(!isSyncable('evil.sh'));
  assert.ok(!isSyncable('.gitignore'));
  assert.ok(!isSyncable('secret.env'));
  assert.ok(!isSyncable('../escape.ts'));
  assert.ok(!isSyncable('sub/x.ts'));
});

test('writeProject 清洗 pxt.json：从 files 剔除不同步的 main.py', async () => {
  const dir = await tmp();
  const pxt = JSON.stringify({
    name: 'g', files: ['main.ts', 'main.py', 'README.md', 'assets.json'],
  });
  writeProject(dir, { 'pxt.json': pxt, 'main.py': 'print(1)' });
  const onDisk = JSON.parse(await readFile(join(dir, 'pxt.json'), 'utf8'));
  assert.ok(!onDisk.files.includes('main.py'), 'pxt.json files 不应再含 main.py');
  assert.ok(onDisk.files.includes('main.ts'));
  assert.ok(!existsSync(join(dir, 'main.py')), 'main.py 不应落盘');
});
