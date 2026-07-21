// Minimal dependency-free Node web server — The Agency's smoke-test subject.
const http = require('http');

const PORT = process.env.PORT || 3000;

// Whole-second uptime, shared by /health (JSON) and /status (HTML) so the two
// routes can never disagree. Floors to an integer; always >= 0 (AC2).
function uptimeSeconds() {
  return Math.floor(process.uptime());
}

// Largest-first, leading-zero-unit-skipping human format. 0 -> "0s" (AC3 empty
// state); seconds are dropped once days appear.
function formatUptime(total) {
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (d) parts.push(d + 'd');
  if (h || d) parts.push(h + 'h');
  if (m && !d) parts.push(m + 'm');
  if (!d) parts.push(s + 's');
  return parts.join(' ') || '0s';
}

function statusPage(uptimeText) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Smoke Test — Status</title>
<style>
:root{--color-bg:#ffffff;--color-fg:#1a1a1a;--color-muted:#6b7280;--color-ok:#16a34a;--color-ok-text:#15803d;--color-ok-bg:#f0fdf4;--font-sans:system-ui, sans-serif;--font-mono:ui-monospace, monospace;--font-size-sm:0.875rem;--font-size-lg:2rem;--space:1rem;--space-sm:0.5rem;--radius:999px;--focus-ring:2px solid var(--color-fg)}
body{font-family:var(--font-sans);color:var(--color-fg);background:var(--color-bg);max-width:24rem;margin:0 auto;padding:calc(var(--space)*2) var(--space);display:grid;gap:var(--space);justify-items:start}
a{color:var(--color-muted);text-decoration:underline;display:inline-block;padding:var(--space-sm) 0}
a:hover{color:var(--color-fg)}
a:focus-visible{outline:var(--focus-ring);outline-offset:calc(var(--space-sm)/4);border-radius:var(--radius)}
.status-badge{display:inline-flex;align-items:center;gap:var(--space-sm);background:var(--color-ok-bg);color:var(--color-ok-text);font-size:var(--font-size-sm);font-weight:bold;padding:var(--space-sm) var(--space);border-radius:var(--radius)}
.status-badge::before{content:"";width:0.6em;height:0.6em;border-radius:var(--radius);background:var(--color-ok)}
.status-uptime{display:grid;gap:calc(var(--space-sm)/2);color:var(--color-muted);font-size:var(--font-size-sm)}
.status-uptime strong{font-family:var(--font-mono);font-size:var(--font-size-lg);font-weight:bold;color:var(--color-fg)}
.status-footnote{font-size:var(--font-size-sm);color:var(--color-muted)}
</style>
</head>
<body>
<h1>Smoke Test — Status</h1>
<p class="status-badge">OK</p>
<p class="status-uptime">Uptime <strong>${uptimeText}</strong></p>
<p class="status-footnote"><a href="/health">machine-readable: /health</a></p>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Smoke Test App</h1><p>Hello from The Agency.</p>');
    return;
  }
  if (req.url === '/health' && (req.method === 'GET' || req.method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime_seconds: uptimeSeconds() }));
    return;
  }
  if (req.url === '/status' && (req.method === 'GET' || req.method === 'HEAD')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(statusPage(formatUptime(uptimeSeconds())));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`smoke-test server listening on http://localhost:${PORT}`);
});

module.exports = server;
