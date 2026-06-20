import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import runDev from '../src/commands/dev.js';

test('dev 起服务并能取到项目', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aca-dev-'));
  await mkdir(join(dir, 'game'));
  await writeFile(join(dir, 'game/main.ts'), 'hi');
  let handle;
  try {
    handle = await runDev({ positionals: [], options: { _noBlock: true, _cwd: dir } });
    const proj = await (await fetch(`${handle.url}/api/project`)).json();
    assert.equal(proj.files['main.ts'], 'hi');
  } finally {
    if (handle) {
      await handle.close();
    }
  }
});
