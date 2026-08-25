#!/usr/bin/env node

/**
 * Automa Ecosystem - Live Scalar API Reference Server
 * Serves modern, interactive OpenAPI documentation on http://localhost:8767 with hot reload.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const openApiPath = path.join(rootDir, 'openapi.json');

const PORT = process.env.PORT || 8767;

// Connected SSE clients for live reload
const sseClients = new Set();

function getScalarHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <title>Automa Ecosystem API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦀</text></svg>" />
    <style>
      body {
        margin: 0;
        background-color: #0b0f19;
      }
      .automa-live-badge {
        position: fixed;
        bottom: 16px;
        right: 16px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #a78bfa;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        padding: 6px 12px;
        border-radius: 9999px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .automa-live-dot {
        width: 8px;
        height: 8px;
        background-color: #10b981;
        border-radius: 50%;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }
    </style>
  </head>
  <body>
    <div class="automa-live-badge">
      <div class="automa-live-dot"></div>
      Automa Core API • Live Reload
    </div>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{
        "theme": "purple",
        "darkMode": true,
        "layout": "modern",
        "showSidebar": true,
        "searchHotKey": "k",
        "metaData": {
          "title": "Automa Ecosystem API Reference",
          "description": "Interactive API Documentation for Automa Rust Core Engine and Daemons"
        },
        "hideModels": false,
        "servers": [
          { "url": "http://127.0.0.1:8765", "description": "Local Rust Daemon" }
        ]
      }'
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>

    <!-- Hot Reload Client -->
    <script>
      const evtSource = new EventSource('/events');
      evtSource.onmessage = (event) => {
        if (event.data === 'reload') {
          console.log('[Scalar] OpenAPI specification updated. Reloading...');
          window.location.reload();
        }
      };
    </script>
  </body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // SSE Hot Reload
  if (url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('data: connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // OpenAPI JSON
  if (url === '/openapi.json') {
    if (fs.existsSync(openApiPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(openApiPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'openapi.json not found. Run pnpm run sync:api first.' }));
    }
    return;
  }

  // Scalar UI Entrypoint
  if (url === '/' || url === '/index.html' || url === '/docs') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getScalarHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Watch openapi.json for changes
if (fs.existsSync(openApiPath)) {
  let debounceTimeout;
  fs.watch(openApiPath, () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log('\x1b[35m[Scalar]\x1b[0m 🔄 openapi.json changed. Notifying browser clients...');
      for (const client of sseClients) {
        client.write('data: reload\n\n');
      }
    }, 300);
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n\x1b[1m\x1b[35m====================================================\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m📖 Automa Scalar API Reference Server\x1b[0m`);
  console.log(`\x1b[1m\x1b[35m====================================================\x1b[0m`);
  console.log(`\x1b[32m✔ Local URL    :\x1b[0m \x1b[1mhttp://127.0.0.1:${PORT}\x1b[0m`);
  console.log(`\x1b[32m✔ OpenAPI Spec :\x1b[0m http://127.0.0.1:${PORT}/openapi.json`);
  console.log(`\x1b[90m⚡ Live reload is active (watching openapi.json)\x1b[0m\n`);
});

