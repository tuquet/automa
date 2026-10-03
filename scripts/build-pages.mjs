import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist-pages');

console.log('🚀 Building Tuquet Automa GitHub Pages artifact...');
console.log('Root Directory  :', rootDir);
console.log('Output Directory:', outDir);

// 1. Prepare clean output directories
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, 'api'), { recursive: true });

// 2. Copy standalone Archify Interactive HTML
const sourceDiagram = path.join(rootDir, 'diagrams', 'runner-automa-pipeline.html');
const destDiagram = path.join(outDir, 'pipeline.html');
if (fs.existsSync(sourceDiagram)) {
  fs.copyFileSync(sourceDiagram, destDiagram);
  console.log('✔ Copied Archify standalone pipeline diagram -> dist-pages/pipeline.html');
} else {
  console.warn('⚠️ Warning: diagrams/runner-automa-pipeline.html not found!');
}

// 3. Copy WebM Animation Video
const sourceWebm = path.join(rootDir, 'diagrams', 'tuquet-platform-multi-repository-orchestration-pipeline.webm');
const destWebm = path.join(outDir, 'tuquet-platform-multi-repository-orchestration-pipeline.webm');
if (fs.existsSync(sourceWebm)) {
  fs.copyFileSync(sourceWebm, destWebm);
  console.log('✔ Copied WebM orchestration video -> dist-pages/tuquet-platform-multi-repository-orchestration-pipeline.webm');
} else {
  console.warn('⚠️ Warning: diagrams/tuquet-platform-multi-repository-orchestration-pipeline.webm not found!');
}

// 4. Copy OpenAPI Spec
const sourceOpenApi = path.join(rootDir, 'packages', 'types', 'openapi.json');
const destOpenApi = path.join(outDir, 'api', 'openapi.json');
if (fs.existsSync(sourceOpenApi)) {
  fs.copyFileSync(sourceOpenApi, destOpenApi);
  console.log('✔ Copied openapi.json -> dist-pages/api/openapi.json');
} else {
  console.warn('⚠️ Warning: packages/types/openapi.json not found!');
}

// 5. Generate Scalar API Reference HTML (api/index.html)
const scalarHtml = `<!doctype html>
<html lang="en">
  <head>
    <title>Tuquet Automa — Core Engine API Reference</title>
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
      .nav-bar {
        background: #090d1a;
        border-bottom: 1px solid #1e293b;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: var(--scalar-font);
      }
      .nav-title {
        color: #f8fafc;
        font-weight: 700;
        font-size: 14px;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .nav-links {
        display: flex;
        gap: 16px;
      }
      .nav-link {
        color: #94a3b8;
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        transition: color 0.15s ease;
      }
      .nav-link:hover {
        color: #38bdf8;
      }
    </style>
  </head>
  <body>
    <div class="nav-bar">
      <a href="../" class="nav-title">
        <span>🦀 Tuquet Automa</span>
        <span style="color: #64748b; font-weight: normal;">| API Reference</span>
      </a>
      <div class="nav-links">
        <a href="../" class="nav-link">← Portal Home</a>
        <a href="../pipeline.html" class="nav-link">🗺️ Interactive Architecture</a>
        <a href="https://github.com/tuquet/automa" target="_blank" rel="noopener" class="nav-link">GitHub ↗</a>
      </div>
    </div>
    <script
      id="api-reference"
      data-url="./openapi.json"
      data-configuration='{
        "theme": "deepSpace",
        "darkMode": true,
        "layout": "modern",
        "showSidebar": true,
        "searchHotKey": "k",
        "metaData": {
          "title": "Tuquet Automa API Reference",
          "description": "Interactive API Documentation for Tuquet Automa Core Engine & Daemons"
        },
        "hideModels": false,
        "servers": [
          { "url": "http://127.0.0.1:8080", "description": "Local Tuquet Automa Daemon" }
        ]
      }'
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
fs.writeFileSync(path.join(outDir, 'api', 'index.html'), scalarHtml, 'utf-8');
console.log('✔ Generated Scalar API reference -> dist-pages/api/index.html');

// 6. Generate Portal Home HTML (index.html)
const portalHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tuquet Automa — High-Performance Automation & OS Orchestration Engine</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛸</text></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #030712;
      --card-bg: rgba(17, 24, 39, 0.7);
      --border: rgba(55, 65, 81, 0.5);
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: var(--font-sans);
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
    }
    header {
      border-bottom: 1px solid var(--border);
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 16px 24px;
    }
    .header-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
    }
    .brand-icon {
      font-size: 24px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      padding: 6px 10px;
      border-radius: 8px;
    }
    .brand-name {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.02em;
    }
    .brand-tag {
      font-size: 11px;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 12px;
      font-family: var(--font-mono);
      font-weight: 600;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.15s ease;
    }
    .nav-link:hover { color: var(--accent); }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #030712;
      box-shadow: 0 0 16px var(--accent-glow);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.4);
    }
    .btn-outline {
      border: 1px solid var(--border);
      background: rgba(17, 24, 39, 0.6);
      color: var(--text-primary);
    }
    .btn-outline:hover {
      border-color: var(--accent);
      background: rgba(56, 189, 248, 0.08);
    }
    main {
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }
    .hero {
      text-align: center;
      margin-bottom: 48px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      color: var(--accent);
      font-family: var(--font-mono);
      margin-bottom: 20px;
    }
    .hero h1 {
      font-size: 44px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.2;
      margin-bottom: 16px;
      background: linear-gradient(180deg, #ffffff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 18px;
      color: var(--text-secondary);
      max-width: 720px;
      margin: 0 auto 32px;
    }
    .cta-group {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .video-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      margin-bottom: 64px;
      backdrop-filter: blur(8px);
    }
    .video-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 8px;
    }
    .video-title {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      box-shadow: 0 0 8px #22c55e;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.9); }
    }
    .video-player {
      width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background: #02040a;
      display: block;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 64px;
    }
    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 0.2s ease;
    }
    .feature-card:hover {
      border-color: var(--accent);
    }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 12px;
    }
    .feature-card h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    .feature-card p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .scoop-section {
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px;
      text-align: center;
      max-width: 840px;
      margin: 0 auto;
    }
    .scoop-section h2 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .scoop-code {
      background: #020617;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 16px 20px;
      border-radius: 10px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: #38bdf8;
      text-align: left;
      overflow-x: auto;
      margin: 20px 0;
    }
    footer {
      border-top: 1px solid var(--border);
      text-align: center;
      padding: 32px 24px;
      color: var(--text-muted);
      font-size: 13px;
    }
    footer a { color: var(--text-secondary); text-decoration: none; }
    footer a:hover { color: var(--accent); }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="./" class="brand">
        <span class="brand-icon">🛸</span>
        <span class="brand-name">Tuquet Automa</span>
        <span class="brand-tag">v1.0 Engine</span>
      </a>
      <nav class="nav-links">
        <a href="pipeline.html" class="nav-link">🗺️ Architecture</a>
        <a href="api/" class="nav-link">📖 API Reference</a>
        <a href="https://github.com/tuquet/automa" target="_blank" rel="noopener" class="nav-link">GitHub ↗</a>
        <a href="pipeline.html?vscode-livepreview=true&present=1" class="btn btn-primary">📺 Present Mode</a>
      </nav>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-badge">
        <span>⚡ Rust Core Engine + MV3 Chrome Extension + Vue 3 Studio</span>
      </div>
      <h1>High-Performance Browser Automation & OS Orchestration</h1>
      <p>
        Zero-zombie process tree supervision, hardware anti-detect Chromium isolation in <code>~/.tuquet/</code>, 
        and an intuitive node-graph canvas for high-density enterprise operations.
      </p>
      <div class="cta-group">
        <a href="pipeline.html" class="btn btn-primary">🗺️ Open Interactive Architecture</a>
        <a href="api/" class="btn btn-outline">📖 Browse Scalar API Reference</a>
        <a href="https://github.com/tuquet/automa" target="_blank" rel="noopener" class="btn btn-outline">⭐️ Star on GitHub</a>
      </div>
    </section>

    <section class="video-card">
      <div class="video-card-header">
        <div class="video-title">
          <span class="pulse-dot"></span>
          <span>Live Multi-Repository Closed-Loop Orchestration Trace</span>
        </div>
        <a href="pipeline.html" class="btn btn-outline" style="font-size: 12px; padding: 4px 10px;">
          Interactive View ↗
        </a>
      </div>
      <video class="video-player" src="tuquet-platform-multi-repository-orchestration-pipeline.webm" autoplay loop muted playsinline></video>
    </section>

    <section class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h3>Zero-Zombie Supervision</h3>
        <p>Runner Supervisor uses kernel-enforced process trees with 0.1ms kill limits, preventing orphan browser processes.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎭</div>
        <h3>Anti-Detect Chromium</h3>
        <p>Dedicated Chromium sandboxes in canonical <code>~/.tuquet/runtimes/</code> spoof Canvas, WebGL, and route through dedicated proxies.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightweight Native Core</h3>
        <p>Compiled Axum/Tokio daemon provides REST, SSE, and WebSocket endpoints with near-zero memory footprint compared to Electron.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">💾</div>
        <h3>SSOT Canonical Storage</h3>
        <p>Offline-first SQLite storage in <code>~/.tuquet/</code> with transparent cloud event replication to Tuquet Cloud Supabase.</p>
      </div>
    </section>

    <section class="scoop-section">
      <h2>🚀 Install via Official Scoop Bucket</h2>
      <p style="color: var(--text-secondary); font-size: 14px;">The cleanest and most unified way to install Tuquet tools on Windows:</p>
      <div class="scoop-code">
# 1. Add official bucket
scoop bucket add tuquet https://github.com/tuquet/tuquet-scoop-bucket

# 2. Install Automa Engine
scoop install automa

# 3. Launch Core Daemon
automa
      </div>
      <a href="https://github.com/tuquet/tuquet-scoop-bucket" target="_blank" rel="noopener" class="btn btn-primary">
        Explore Scoop Bucket ↗
      </a>
    </section>
  </main>

  <footer>
    <p>
      © 2026 Tuquet Ecosystem. Distributed under the MIT License. · 
      <a href="https://github.com/tuquet">Tuquet Organization</a> · 
      <a href="api/">OpenAPI Specs</a> · 
      <a href="pipeline.html">System Visualizer</a>
    </p>
  </footer>
</body>
</html>`;
fs.writeFileSync(path.join(outDir, 'index.html'), portalHtml, 'utf-8');
console.log('✔ Generated Portal Home -> dist-pages/index.html');

console.log('\n🎉 Successfully built Tuquet Automa GitHub Pages artifact in dist-pages/!\n');
