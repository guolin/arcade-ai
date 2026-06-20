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
    // 判定信号：官方编辑器触发 workspacesync → host 页据此请求 /api/project。
    // 这是双向链路的关键握手点，比截图可靠。
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
