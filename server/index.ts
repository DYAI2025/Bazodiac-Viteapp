import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json());

// ── Health check (Railway health probe) ─────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── API routes will be added here in Phase 2–3 ──────────────────────────────
// POST /api/reading
// POST /api/checkout
// GET  /api/reading/unlock
// POST /api/webhooks/stripe

// ── Serve Vite production build ──────────────────────────────────────────────

const distPath = path.resolve(__dirname, '..', 'dist');

app.use(express.static(distPath));

// SPA fallback — all non-API routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Bazodiac BFF running on port ${PORT}`);
});
