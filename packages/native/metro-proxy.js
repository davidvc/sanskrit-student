/**
 * Manifest-rewriting proxy for Cloudflare tunnel dev setup.
 *
 * Architecture:
 *   Expo Go → https://TUNNEL_HOST → Cloudflare → this proxy:8082 → Metro:8081
 *
 * Metro generates manifest URLs with http://TUNNEL_HOST:8081 (wrong port, wrong scheme).
 * This proxy rewrites them to https://TUNNEL_HOST so Expo Go can reach them via Cloudflare.
 */
const http = require('http');
const net = require('net');

const METRO_PORT = 8081;
const PROXY_PORT = 8082;
const TUNNEL_HOST = process.argv[2];

if (!TUNNEL_HOST) {
  console.error('Usage: node metro-proxy.js <tunnel-host>');
  process.exit(1);
}

function rewriteUrls(body) {
  return body
    .split(`http://${TUNNEL_HOST}:${METRO_PORT}`).join(`https://${TUNNEL_HOST}`)
    .split(`ws://${TUNNEL_HOST}:${METRO_PORT}`).join(`wss://${TUNNEL_HOST}`)
    .split(`http://localhost:${METRO_PORT}`).join(`https://${TUNNEL_HOST}`)
    .split(`ws://localhost:${METRO_PORT}`).join(`wss://${TUNNEL_HOST}`);
}

function shouldRewrite(req, contentType) {
  return contentType.includes('application/json')
    || contentType.includes('text/')
    || req.url === '/'
    || req.url.startsWith('/_expo/');
}

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: 'localhost',
    port: METRO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: `localhost:${METRO_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || '';

    if (shouldRewrite(clientReq, contentType)) {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        const rewritten = rewriteUrls(Buffer.concat(chunks).toString());
        const headers = { ...proxyRes.headers };
        headers['content-length'] = Buffer.byteLength(rewritten).toString();
        delete headers['transfer-encoding'];
        clientRes.writeHead(proxyRes.statusCode, headers);
        clientRes.end(rewritten);
      });
    } else {
      clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(clientRes);
    }
  });

  proxyReq.on('error', err => {
    clientRes.writeHead(502);
    clientRes.end(`Proxy error: ${err.message}`);
  });

  clientReq.pipe(proxyReq);
});

// Forward WebSocket connections (Metro HMR / fast refresh)
server.on('upgrade', (req, socket) => {
  const conn = net.connect(METRO_PORT, 'localhost', () => {
    conn.write(`GET ${req.url} HTTP/1.1\r\n`);
    conn.write(`Host: localhost:${METRO_PORT}\r\n`);
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      conn.write(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`);
    }
    conn.write('\r\n');
    conn.pipe(socket);
    socket.pipe(conn);
  });
  conn.on('error', () => socket.destroy());
  socket.on('error', () => conn.destroy());
});

server.listen(PROXY_PORT, () => {
  console.log(`Metro proxy ready on port ${PROXY_PORT} → Metro on ${METRO_PORT}`);
});
