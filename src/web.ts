/**
 * Web desk UI server
 */

import { createServer } from 'http';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { loadPacket, updatePacketAcceptance } from './packet.js';
import { verifyPacket } from './verifier.js';
import { AcceptanceStatus } from './types.js';

const PORT = 43126;

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clearance Desk</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    header {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { color: #666; }
    .packet-list {
      display: grid;
      gap: 1rem;
    }
    .packet-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .packet-card:hover { transform: translateY(-2px); }
    .packet-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    .packet-id {
      font-family: monospace;
      font-size: 0.9rem;
      color: #666;
    }
    .verdict {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .verdict.DONE { background: #d4edda; color: #155724; }
    .verdict.NOT_DONE { background: #f8d7da; color: #721c24; }
    .verdict.NEEDS_HUMAN { background: #fff3cd; color: #856404; }
    .verdict.pending { background: #e7e7e7; color: #666; }
    .packet-ask {
      font-size: 1.1rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    .packet-meta {
      font-size: 0.9rem;
      color: #666;
    }
    .evidence-count {
      display: inline-block;
      margin-right: 1rem;
    }
    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .status.accepted { background: #d4edda; color: #155724; }
    .status.rejected { background: #f8d7da; color: #721c24; }
    .status.changes_requested { background: #fff3cd; color: #856404; }
    .status.pending { background: #e7e7e7; color: #666; }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 8px;
    }
    .empty-state h2 { margin-bottom: 1rem; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Clearance Desk</h1>
      <p class="subtitle">Done + evidence + human-accept desk for agent deliverables</p>
    </header>
    <div id="packet-list"></div>
  </div>
  <script>
    async function loadPackets() {
      const response = await fetch('/api/packets');
      const packets = await response.json();
      
      const listEl = document.getElementById('packet-list');
      
      if (packets.length === 0) {
        listEl.innerHTML = \`
          <div class="empty-state">
            <h2>No packets yet</h2>
            <p>Create a packet using the CLI or API</p>
          </div>
        \`;
        return;
      }
      
      listEl.innerHTML = \`<div class="packet-list">\${packets.map(p => \`
        <div class="packet-card" onclick="window.location.href='/packet/\${p.id}'">
          <div class="packet-header">
            <span class="packet-id">\${p.id}</span>
            <span class="verdict \${p.verdict || 'pending'}">\${p.verdict || 'PENDING'}</span>
          </div>
          <div class="packet-ask">\${p.ask}</div>
          <div class="packet-meta">
            <span class="evidence-count">📎 \${p.evidence.length} evidence items</span>
            <span class="status \${p.acceptanceStatus}">\${p.acceptanceStatus.replace('_', ' ').toUpperCase()}</span>
          </div>
        </div>
      \`).join('')}</div>\`;
    }
    
    loadPackets();
    setInterval(loadPackets, 5000);
  </script>
</body>
</html>
`;

async function handleRequest(req: any, res: any) {
  const url = new URL(req.url!, `http://localhost:${PORT}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML_TEMPLATE);
    return;
  }

  if (url.pathname === '/api/packets') {
    try {
      const packetsDir = './data/packets';
      if (!existsSync(packetsDir)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('[]');
        return;
      }

      const files = await readdir(packetsDir);
      const packets = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(f => loadPacket(f.replace('.json', '')))
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(packets.filter(Boolean)));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load packets' }));
    }
    return;
  }

  if (url.pathname.startsWith('/api/packet/')) {
    const packetId = url.pathname.split('/').pop();
    try {
      const packet = await loadPacket(packetId!);
      if (!packet) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Packet not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(packet));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load packet' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Clearance web desk running on http://localhost:${PORT}`);
});
