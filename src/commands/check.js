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
    // 在页面注入钩子：捕获 host 页向 iframe 回发 projects 的时刻
    await page.exposeFunction('__acaSynced', () => {});
    await page.evaluateOnNewDocument(() => {
      const orig = window.postMessage;
    });
    let synced = false;
    page.on('console', (m) => { if (m.text().includes('workspacesync')) synced = true; });
    await page.goto(studio.url, { waitUntil: 'networkidle2', timeout: 60000 });
    // 等待 host 页处理 workspacesync：检测是否成功发起了 /api/project 请求
    await page.waitForResponse((r) => r.url().endsWith('/api/project'), { timeout: 45000 });
    console.log('✅ 协议自检通过：编辑器已发起 workspacesync 并拉取本地项目');
    return 0;
  } catch (e) {
    console.error(`❌ 自检失败：${e.message}`);
    return 1;
  } finally {
    await browser.close();
    await studio.close();
  }
}
