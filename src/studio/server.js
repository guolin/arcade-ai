import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readProject, writeProject } from '../project-io.js';
import { createWatcher } from './watcher.js';

export function startStudio({ gameDir, port = 0, hostHtmlPath }) {
  const clients = new Set();
  const watcher = createWatcher(gameDir, () => {
    for (const res of clients) res.write('data: changed\n\n');
  });

  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && url === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(readFileSync(hostHtmlPath));
    } else if (req.method === 'GET' && url === '/api/project') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ files: readProject(gameDir) }));
    } else if (req.method === 'POST' && url === '/api/save') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try {
          const { files } = JSON.parse(body || '{}');
          watcher.pause(600);
          writeProject(gameDir, files);
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
