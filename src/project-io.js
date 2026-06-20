import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// MakeCode arcade 项目文件按扩展名同步（项目文件都在项目根，无子目录）。
// 这样 tilemap/命名资源生成的 *.g.ts / *.g.jres 也能完整往返，而不是被固定白名单丢弃。
// 纯 JS 工具：不收 .py（编辑器从 main.ts 自动转译的 Python 产物）。
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

// 让 pxt.json 的 files 与实际同步的文件一致：剔除不同步的条目（如 main.py），
// 否则磁盘上会出现"声明了却不存在"的悬空引用。
function sanitizePxtJson(content) {
  try {
    const j = JSON.parse(content);
    if (Array.isArray(j.files)) {
      const cleaned = j.files.filter((f) => isSyncable(f));
      if (cleaned.length !== j.files.length) {
        j.files = cleaned;
        return JSON.stringify(j, null, 4) + '\n';
      }
    }
  } catch { /* 非法 JSON：原样写回，不阻断 */ }
  return content;
}

export function writeProject(gameDir, files, opts = {}) {
  const written = [];
  for (const name of Object.keys(files || {})) {
    if (!isSyncable(name)) continue;
    let content = files[name] ?? '';
    if (name === 'pxt.json') content = sanitizePxtJson(content);
    opts.beforeWrite?.();
    writeFileSync(join(gameDir, name), content, 'utf8');
    written.push(name);
  }
  return written;
}
