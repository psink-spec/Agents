// Minimal dependency-free Node web server — The Agency's smoke-test subject.
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Smoke Test App</h1><p>Hello from The Agency.</p>');
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`smoke-test server listening on http://localhost:${PORT}`);
});

module.exports = server;
