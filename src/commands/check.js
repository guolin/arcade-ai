import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startStudio } from '../studio/server.js';

const here = dirname(fileURLToPath(import.meta.url));
const hostHtmlPath = join(here, '..', 'host', 'index.html');
const gameDir = join(here, '..', 'template', 'game');   // 用内置模板当样本

export default async function check(ctx) {
  let puppeteer;
  try { puppeteer = (await import('puppeteer')).default; }
  catch { console.error('需要 puppeteer：npm i -D puppeteer'); return 2; }

  const studio = await startStudio({ gameDir, port: 0, hostHtmlPath });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(studio.url, { waitUntil: 'networkidle2', timeout: 60000 });

    // 第 1 关：握手 —— 编辑器触发 workspacesync，host 页据此请求 /api/project。
    await page.waitForResponse((r) => r.url().endsWith('/api/project'), { timeout: 45000 });
    console.log('  · 握手成功：编辑器已发起 workspacesync 并拉取本地项目');

    // 第 2 关（关键）：渲染 —— 等编辑器把 main.ts 真正显示出来。
    // 仅靠握手是不够的：项目可能加载成空白积木视图。必须确认代码可见。
    const editorFrame = await waitForEditorFrame(page);
    const SNIPPET = 'sprites.create';
    await editorFrame.waitForFunction((kw) => {
      const lines = [...document.querySelectorAll('.view-line')].map((l) => l.textContent).join('\n');
      return lines.includes(kw);
    }, { timeout: 30000 }, SNIPPET);
    console.log('  · 渲染成功：编辑器 JS 视图已显示 main.ts 代码');

    console.log('✅ 协议自检通过：握手 + 代码渲染均成立');
    return 0;
  } catch (e) {
    console.error(`❌ 自检失败：${e.message}`);
    console.error('   （若卡在"渲染"步：多半是项目以空白积木视图打开——检查 pxt.json 是否误含 main.blocks / preferredEditor 是否为 tsprj）');
    return 1;
  } finally {
    await browser.close();
    await studio.close();
  }
}

// 官方编辑器主 frame（排除文档/模拟器子 frame）
async function waitForEditorFrame(page) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const f = page.frames().find((fr) =>
      fr.url().includes('makecode.com') &&
      !fr.url().includes('---docs') &&
      !fr.url().includes('---simulator'));
    if (f) return f;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('未找到官方编辑器 iframe');
}
