import { cpSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const templateDir = join(here, '..', 'template');
// reference 是知识层，随 skill 与 npm 包一起发布（仓库根 /reference）
export const referenceDir = join(here, '..', '..', 'reference');

const RULES = {
  claude: { src: 'claude.md', dest: 'CLAUDE.md' },
  trae: { src: 'project_rules.md', dest: '.trae/project_rules.md' },
  agents: { src: 'agents.md', dest: 'AGENTS.md' },
};

function writeRules(dest, tool) {
  const r = RULES[tool] || RULES.agents;
  const content = readFileSync(join(here, '..', 'rules', r.src), 'utf8');
  const target = join(dest, r.dest);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, 'utf8');
}

const TEMPLATES = ['platformer', 'flappy', 'blank'];
const DEFAULT_TEMPLATE = 'blank';

export default async function init(ctx) {
  const dest = ctx.positionals[0] || 'arcade-game';
  const tpl = ctx.options.template || DEFAULT_TEMPLATE;

  if (!TEMPLATES.includes(tpl)) {
    console.error(`未知模板: ${tpl}，可选: ${TEMPLATES.join(', ')}`);
    return 1;
  }

  mkdirSync(dest, { recursive: true });
  // 每个模板是完整的 game/ 目录，直接拷贝
  cpSync(join(templateDir, tpl, 'game'), join(dest, 'game'), { recursive: true });
  copyFileSync(join(templateDir, 'package.json'), join(dest, 'package.json'));
  // 把知识库拷进项目，使其自包含、跨工具可查（Trae/其它 AI 裸读项目也能用）
  cpSync(referenceDir, join(dest, 'reference'), { recursive: true });
  writeRules(dest, ctx.options.tool);
  console.log(`✅ 已创建 ${dest}（模板: ${tpl}）\n  cd ${dest} && npx aca dev`);
  return 0;
}
