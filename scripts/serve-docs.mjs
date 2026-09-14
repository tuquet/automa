#!/usr/bin/env node

/**
 * Automa Ecosystem - Live Scalar API Reference Server
 * Serves modern, interactive OpenAPI documentation on http://localhost:8767 with hot reload.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { pc, rootDir } from './lib/utils.mjs';

const openApiPath = path.join(rootDir, 'packages', 'automa-types', 'openapi.json');
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
      :root {
        --scalar-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --scalar-font-code: 'JetBrains Mono', ui-monospace, monospace;
        --scalar-radius: 8px;
      }
      body {
        margin: 0;
        background-color: #050811;
        font-family: var(--scalar-font);
      }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{
        "theme": "deepSpace",
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
      console.log(`${pc.magenta('[Scalar]')} 🔄 openapi.json changed. Notifying browser clients...`);
      for (const client of sseClients) {
        client.write('data: reload\n\n');
      }
    }, 300);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n${pc.red(`❌ Port ${PORT} is already in use.`)}`);
    console.error(`${pc.yellow(`👉 Either terminate the existing process or run with: PORT=8768 node scripts/serve-docs.mjs`)}\n`);
  } else {
    console.error(`\n${pc.red(`❌ Server error:`)}`, err.message);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n${pc.bold(pc.magenta('===================================================='))}`);
  console.log(`${pc.bold(pc.cyan('📖 Automa Scalar API Reference Server'))}`);
  console.log(`${pc.bold(pc.magenta('===================================================='))}`);
  console.log(`${pc.green('✔ Local URL    :')} ${pc.bold(`http://127.0.0.1:${PORT}`)}`);
  console.log(`${pc.green('✔ OpenAPI Spec :')} http://127.0.0.1:${PORT}/openapi.json`);
  console.log(`${pc.dim('⚡ Live reload is active (watching openapi.json)\n')}`);
});
