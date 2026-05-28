import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Mashru3i API', ts: new Date().toISOString() }));

// Auth
app.use('/api/auth', authRoutes);

// Example protected route
import { authenticate, requireRole } from './middlewares/auth.js';
app.get('/api/admin/secret', authenticate, requireRole('admin'), (_req, res) => {
  res.json({ ok: true, secret: 'Only admins can see this.' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal error' });
});

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});





