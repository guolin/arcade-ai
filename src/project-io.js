import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// MakeCode arcade 项目文件按扩展名同步（项目文件都在项目根，无子目录）。
// 这样 tilemap/命名资源生成的 *.g.ts / *.g.jres 也能完整往返，而不是被固定白名单丢弃。
const SYNC_EXTS = new Set(['.ts', '.js', '.json', '.md', '.blocks', '.jres', '.txt']);

// 目录黑名单：依赖、产物，不参与同步。
const SKIP_DIRS = new Set(['pxt_modules', 'built', 'node_modules', '.git']);

// 一个文件名是否该同步：纯文件名（防路径遍历）、非隐藏、扩展在白名单内。
export function isSyncable(name) {
  if (typeof name !== 'string' || name.length === 0) return false;
  if (name !== basename(name)) return false;          // 拒绝 ../x、sub/x、/abs 等
  if (name.startsWith('.')) return false;             // 排除 .gitignore 等隐藏文件
  return SYNC_EXTS.has(extname(name).toLowerCase());
}

export function readProject(gameDir) {
  const out = {};
  for (const name of readdirSync(gameDir)) {
    if (SKIP_DIRS.has(name)) continue;
    if (!isSyncable(name)) continue;
    const p = join(gameDir, name);
    if (!statSync(p).isFile()) continue;              // 跳过同名目录
    out[name] = readFileSync(p, 'utf8');
  }
  return out;
}

export function writeProject(gameDir, files, opts = {}) {
  const written = [];
  for (const name of Object.keys(files || {})) {
    if (!isSyncable(name)) continue;
    opts.beforeWrite?.();
    writeFileSync(join(gameDir, name), files[name] ?? '', 'utf8');
    written.push(name);
  }
  return written;
}
