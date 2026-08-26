import http, { type Server } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

export interface FixtureServerInstance {
  server: Server;
  port: number;
  baseUrl: string;
  close: () => Promise<void>;
}

export function startFixtureServer(): Promise<FixtureServerInstance> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url || '/';
      const cleanPath = urlPath.split('?')[0].replace(/^\//, '') || 'forms.html';
      const filePath = path.join(__dirname, cleanPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html' : 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Fixture Not Found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        const baseUrl = `http://127.0.0.1:${port}`;
        resolve({
          server,
          port,
          baseUrl,
          close: () =>
            new Promise((resClose) => {
              server.close(() => resClose());
            }),
        });
      } else {
        reject(new Error('Failed to obtain server address'));
      }
    });

    server.on('error', (err) => {
      reject(err);
    });
  });
}
