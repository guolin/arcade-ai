import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeProject } from '../project-io.js';

const here = dirname(fileURLToPath(import.meta.url));
const referenceDir = join(here, '..', '..', 'reference');
const templateDir = join(here, '..', 'template');

const RULES = {
  claude: { src: 'claude.md', dest: 'CLAUDE.md' },
  trae:   { src: 'project_rules.md', dest: '.trae/project_rules.md' },
  agents: { src: 'agents.md', dest: 'AGENTS.md' },
};

function writeRules(dest, tool) {
  const r = RULES[tool] || RULES.agents;
  const content = readFileSync(join(here, '..', 'rules', r.src), 'utf8');
  const target = join(dest, r.dest);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}

// 从各种 MakeCode URL 格式中提取脚本 ID
export function extractId(url) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return url.trim(); // 直接传入裸 ID 也可
  }
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'arcade-game';
}

export default async function clone(ctx) {
  const rawUrl = ctx.positionals[0];
  if (!rawUrl) {
    console.error('用法: aca clone <分享链接> [目录] [--tool claude|trae|agents]');
    return 1;
  }

  const id = extractId(rawUrl);

  // 1. 获取项目元数据（短链和数字 ID 均支持）
  console.log(`[clone] 获取项目信息...`);
  let meta;
  try {
    const r = await fetch(`https://makecode.com/api/${id}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    meta = await r.json();
  } catch (e) {
    console.error(`[clone] 无法获取项目元数据: ${e.message}`);
    return 1;
  }

  const canonicalId = meta.id || id;
  const projectName = meta.name || 'arcade-game';
  const isBlocks = meta.editor === 'blocksprj';
  const isPython = meta.editor === 'pyprj';

  // 2. 下载所有源文件
  console.log(`[clone] 下载 "${projectName}"...`);
  let files;
  try {
    const r = await fetch(`https://makecode.com/api/${canonicalId}/text`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    files = await r.json();
  } catch (e) {
    console.error(`[clone] 无法下载源文件: ${e.message}`);
    return 1;
  }

  // 3. 转为纯 TypeScript：去掉 blocks/py 产物，修正 pxt.json
  delete files['main.blocks'];
  delete files['main.py'];

  if (files['pxt.json']) {
    try {
      const pxt = JSON.parse(files['pxt.json']);
      pxt.preferredEditor = 'tsprj';
      pxt.languageRestriction = 'javascript-only';
      pxt.files = (pxt.files || []).filter(f => f !== 'main.blocks' && f !== 'main.py');
      delete pxt.targetVersions;
      files['pxt.json'] = JSON.stringify(pxt, null, 4) + '\n';
    } catch { /* JSON 损坏则原样写入 */ }
  }

  // 4. 落盘
  const dest = ctx.positionals[1] || toSlug(projectName);
  const gameDir = join(dest, 'game');
  mkdirSync(gameDir, { recursive: true });
  const written = writeProject(gameDir, files);
  copyFileSync(join(templateDir, 'package.json'), join(dest, 'package.json'));
  cpSync(referenceDir, join(dest, 'reference'), { recursive: true });
  writeRules(dest, ctx.options.tool);

  const converted = isBlocks ? 'Blocks' : isPython ? 'Python' : null;
  const note = converted ? `\n  ⚠️  原始为 ${converted} 项目，已转为纯 TS（${written.length} 个文件）` : '';
  console.log(`✅ 已克隆 "${projectName}" → ${dest}${note}\n  cd ${dest} && npx aca dev`);
  return 0;
}
