/**
 * Transisstant Serverless Gateway / Nebius AI Cloud Server
 *
 * This server serves as:
 * 1. An API proxy to Nebius Token Factory (api.tokenfactory.nebius.com) protecting your API key.
 * 2. A Nebius Serverless Endpoint handler for asynchronous processing and token streaming.
 * 3. Static host for the built Transisstant React client.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as datasetBackend from './dataset_backend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Sign Language MNIST Dataset on boot
datasetBackend.initDataset();

const PORT = process.env.PORT || 3000;
const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY || '';
const NEBIUS_BASE_URL = 'api.tokenfactory.nebius.com';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'Transisstant Nebius Gateway & Sign MNIST Engine',
      nebiusConfigured: Boolean(NEBIUS_API_KEY),
      datasetReady: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Sign Language MNIST Dataset API Endpoints
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  
  if (parsedUrl.pathname === '/api/dataset/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(datasetBackend.getStats()));
    return;
  }

  if (parsedUrl.pathname === '/api/dataset/samples' && req.method === 'GET') {
    const letter = parsedUrl.searchParams.get('letter');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(datasetBackend.getSamples(letter)));
    return;
  }

  if (parsedUrl.pathname === '/api/dataset/random' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(datasetBackend.getRandomSample()));
    return;
  }

  if (parsedUrl.pathname === '/api/dataset/classify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const result = datasetBackend.classifyPixels(payload.pixels);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Proxy to Nebius Token Factory
  if (req.url === '/api/chat/completions' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const apiKey = req.headers['authorization']?.replace('Bearer ', '') || NEBIUS_API_KEY;

      const proxyReq = https.request({
        hostname: NEBIUS_BASE_URL,
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Nebius Proxy Error:', err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to communicate with Nebius Token Factory', details: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // Static File Serving from dist/
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(__dirname, 'dist', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Transisstant Server active on http://localhost:${PORT}`);
  console.log(`🤖 Nebius Token Factory Gateway: https://${NEBIUS_BASE_URL}`);
  console.log(`⚡ API Key Configured: ${NEBIUS_API_KEY ? 'YES' : 'NO (simulation fallback ready)'}`);
  console.log(`=======================================================`);
});
