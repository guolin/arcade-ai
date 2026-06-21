import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readProject, writeProject } from '../project-io.js';
import { createWatcher } from './watcher.js';

function hashFiles(files) {
  const h = createHash('sha1');
  for (const k of Object.keys(files).sort()) h.update(k + '\0' + (files[k] ?? ''));
  return h.digest('hex');
}

export function startStudio({ gameDir, port = 0, hostHtmlPath }) {
  const clients = new Set();
  let lastAiWriteAt = 0;   // AI 写盘时刻
  let lastPushedHash = ''; // 最后一次推给编辑器的内容 hash

  const watcher = createWatcher(gameDir, () => {
    lastAiWriteAt = Date.now();
    for (const res of clients) res.write('data: changed\n\n');
  });

  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && url === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(readFileSync(hostHtmlPath));
    } else if (req.method === 'GET' && url === '/api/project') {
      const files = readProject(gameDir);
      lastPushedHash = hashFiles(files);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ files }));
    } else if (req.method === 'POST' && url === '/api/save') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const { files } = JSON.parse(body || '{}');

          // 时间层：AI 写盘后 2 秒内的 save 是旧 iframe 临死前的遗留，丢弃
          const msSinceAiWrite = Date.now() - lastAiWriteAt;
          if (lastAiWriteAt > 0 && msSinceAiWrite < 2000) {
            console.log(`[save] 忽略（AI 写盘后 ${msSinceAiWrite}ms，旧 iframe 遗留）`);
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // 内容层：编辑器把我们推出去的内容原样还回来（echo），跳过落盘
          const incomingHash = hashFiles(files || {});
          if (incomingHash === lastPushedHash) {
            console.log('[save] 忽略（内容与上次推送一致，echo）');
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
          }

          watcher.pause(600);
          const written = writeProject(gameDir, files);
          lastPushedHash = incomingHash;
          const incoming = Object.keys(files || {});
          const dropped = incoming.filter((f) => !written.includes(f));
          console.log(`[save] 收到 ${incoming.length} 文件，落盘 ${written.length}`);
          if (dropped.length) console.warn(`[save] ⚠️ 未同步（扩展不支持/不安全）: ${dropped.join(', ')}`);
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500); res.end(String(e));
        }
      });
    } else if (req.method === 'GET' && url === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      res.write('retry: 1000\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
    } else {
      res.writeHead(404); res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: p } = server.address();
      resolve({
        url: `http://127.0.0.1:${p}`,
        port: p,
        async close() {
          for (const r of clients) r.end();
          await watcher.close();
          server.closeAllConnections?.();
          server.close();
        },
      });
    });
  });
}
