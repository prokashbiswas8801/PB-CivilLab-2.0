import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const isBehindNginx = Boolean(process.env.NGINX_PORT || process.env.DEFAULT_APP_PORT);
const PORT = isBehindNginx
  ? (Number(process.env.DEFAULT_APP_PORT) || 3000)
  : (Number(process.env.PORT) || 3000);

app.use(express.json());

// Immediate health check endpoints for Cloud Run startup/liveness probes
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

const distPath = path.join(__dirname, 'dist');

// Serve static assets from the Vite build directory with caching
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));
}

// Fallback to index.html for client-side SPA routing
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`<!DOCTYPE html>
<html>
  <head><title>PB CivilLab</title><meta http-equiv="refresh" content="3"></head>
  <body style="font-family:sans-serif;text-align:center;padding:50px;">
    <h2>PB CivilLab</h2>
    <p>Loading application resources... Please wait.</p>
  </body>
</html>`);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[PB CivilLab] Production application server listening on 0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[PB CivilLab] SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('[PB CivilLab] HTTP server closed cleanly.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
