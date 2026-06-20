import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startStudio } from '../src/studio/server.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('/api/project 返回项目文件，/api/save 写盘', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aca-s-'));
  await writeFile(join(dir, 'main.ts'), 'orig');
  const hostHtml = join(dir, 'host.html');
  await writeFile(hostHtml, '<html>host</html>');
  let s;
  try {
    s = await startStudio({ gameDir: dir, hostHtmlPath: hostHtml });

    const proj = await (await fetch(`${s.url}/api/project`)).json();
    assert.equal(proj.files['main.ts'], 'orig');

    const r = await fetch(`${s.url}/api/save`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ files: { 'main.ts': 'edited' } }),
    });
    assert.equal((await r.json()).success, true);
    const proj2 = await (await fetch(`${s.url}/api/project`)).json();
    assert.equal(proj2.files['main.ts'], 'edited');

    const home = await (await fetch(`${s.url}/`)).text();
    assert.match(home, /host/);
  } finally {
    if (s) {
      await s.close();
    }
  }
});

test('/events 在文件变化时推送 changed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aca-s2-'));
  const hostHtml = join(dir, 'host.html');
  await writeFile(hostHtml, 'x');

  let s;
  const ctrl = new AbortController();
  let reader;
  try {
    s = await startStudio({ gameDir: dir, hostHtmlPath: hostHtml });
    const res = await fetch(`${s.url}/events`, { signal: ctrl.signal });
    reader = res.body.getReader();

    // 1. Consume the initial connection message (retry: 1000)
    const firstRead = await reader.read();
    const firstText = new TextDecoder().decode(firstRead.value);
    assert.match(firstText, /retry/);

    await wait(300);

    // 2. Modify file and wait for change event
    await writeFile(join(dir, 'main.ts'), 'changed-now');
    const secondRead = await reader.read();
    const secondText = new TextDecoder().decode(secondRead.value);
    assert.match(secondText, /changed/);
  } finally {
    ctrl.abort();
    if (reader) {
      await reader.cancel().catch(() => {});
    }
    if (s) {
      await s.close();
    }
  }
});
