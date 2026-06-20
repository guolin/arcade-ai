import { cpSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const templateDir = join(here, '..', 'template');

export default async function init(ctx) {
  const dest = ctx.positionals[0] || 'arcade-game';
  mkdirSync(dest, { recursive: true });
  cpSync(join(templateDir, 'game'), join(dest, 'game'), { recursive: true });
  copyFileSync(join(templateDir, 'package.json'), join(dest, 'package.json'));
  console.log(`✅ 已创建 ${dest}\n  cd ${dest} && npx aca dev`);
  return 0;
}
