import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from './middleware/logger';
import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import streamRoutes from './routes/streams';
import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

function getAllowedOrigins(env: Bindings): string[] {
  const defaultOrigins = ['http://localhost:5173', 'http://localhost:8787'];
  if (!env.CORS_ORIGINS?.trim()) {
    return defaultOrigins;
  }
  const configured = env.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : defaultOrigins;
}

app.use('*', (c, next) => {
  const origins = getAllowedOrigins(c.env);
  return cors({ origin: origins, credentials: true })(c, next);
});
app.use('*', logger());

app.route('/auth', authRoutes);
app.route('/videos', videoRoutes);
app.route('/streams', streamRoutes);

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

app.onError((err, c) => {
  console.error(err);
  return c.json(
    { error: 'Internal Server Error', message: err.message },
    500
  );
});

export default app;
