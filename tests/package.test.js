import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('SKILL.md 含 frontmatter 与命令', () => {
  const t = readFileSync('SKILL.md', 'utf8');
  assert.match(t, /^---/);
  assert.match(t, /name:/);
  assert.match(t, /aca (init|dev|check)/);
});

test('README 含三工具安装', () => {
  const t = readFileSync('README.md', 'utf8');
  for (const kw of ['plugin marketplace', '.trae', 'AGENTS.md']) {
    assert.ok(t.includes(kw), `README 缺 ${kw}`);
  }
});

test('package.json files 含 src 与 reference', () => {
  const p = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.ok(p.files.includes('src'));
  assert.ok(p.files.includes('reference'), 'files 应含 reference（随包发布知识库）');
});

test('reference 与 SKILL.md 同级（构成完整 skill）', () => {
  assert.ok(existsSync('SKILL.md'));
  assert.ok(existsSync('reference/arcade-api.md'));
  assert.ok(existsSync('reference/pitfalls.md'));
});
