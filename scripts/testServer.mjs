import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': filePath.endsWith('.html') ? 'text/html' : 'application/javascript' });
  res.end(content);
});

server.listen(4173, '127.0.0.1', () => {
  console.log('Server listening on http://127.0.0.1:4173');
  http.get('http://127.0.0.1:4173', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`[PASS] Server returned HTTP ${res.statusCode}`);
      console.log(`[PASS] HTML Content contains "ChainGuard AI": ${data.includes('ChainGuard AI')}`);
      console.log(`[PASS] HTML length: ${data.length} bytes`);
      server.close();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error('HTTP GET failed:', err);
    server.close();
    process.exit(1);
  });
});
