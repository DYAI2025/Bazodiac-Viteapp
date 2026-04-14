import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { notFoundHandler, errorHandler } from './errorHandler.js';
import { readingRouter } from './routes/reading.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────

// Request logger — skips /api/reading bodies to avoid logging PII (REQ-SEC-data-protection)
app.use((req, _res, next) => {
  const bodyLoggable = req.path !== '/api/reading';
  console.log(`[req] ${req.method} ${req.path}${bodyLoggable ? '' : ' (body omitted)'}`);
  next();
});

app.use(express.json());

// ── Health check (Railway health probe) ─────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── API routes ───────────────────────────────────────────────────────────────

app.use('/api/reading', readingRouter);

// POST /api/checkout        — Phase 3
// GET  /api/reading/unlock  — Phase 3
// POST /api/webhooks/stripe — Phase 3

// ── Serve Vite production build ──────────────────────────────────────────────

const distPath = path.resolve(__dirname, '..', 'dist');

app.use(express.static(distPath));

// JSON 404 for unmatched /api/* routes (before SPA fallback)
app.use('/api', notFoundHandler);

// SPA fallback — all other routes serve index.html for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Error handlers (must come after all routes) ──────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`Bazodiac BFF running on port ${config.port}`);
});
