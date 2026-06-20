import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { startStudio } from '../studio/server.js';

const here = dirname(fileURLToPath(import.meta.url));
const hostHtmlPath = join(here, '..', 'host', 'index.html');

function openBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).unref(); } catch {}
}

export default async function dev(ctx) {
  const cwd = ctx.options._cwd || process.cwd();
  const gameDir = join(cwd, 'game');
  const port = ctx.options._noBlock ? 0 : Number(ctx.options.port || 8080);
  const studio = await startStudio({ gameDir, port, hostHtmlPath });
  if (ctx.options._noBlock) return studio;
  console.log(`🎮 studio: ${studio.url}`);
  openBrowser(studio.url);
  return new Promise(() => {});   // 常驻
}
