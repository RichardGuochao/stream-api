import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import { v4 as uuidv4 } from 'uuid';
import { verifyGoogleIdToken } from '../services/google-auth';
import { createToken } from '../utils/jwt';
import { jsonUnauthorized, jsonNotFound } from '../utils/response';
import type { Bindings } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/google', async (c) => {
  try {
    const body = await c.req.json<{ id_token: string }>();
    const { id_token } = body;
    if (!id_token) {
      return c.json({ error: 'id_token is required' }, 400);
    }

    const payload = await verifyGoogleIdToken(id_token, c.env.GOOGLE_CLIENT_ID);
    if (!payload?.email) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    )
      .bind(payload.email)
      .first<{ id: string }>();

    let userId: string;
    if (!existingUser) {
      userId = uuidv4();
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(
          userId,
          payload.email,
          payload.name ?? null,
          payload.picture ?? null,
          new Date().toISOString()
        )
        .run();
    } else {
      userId = existingUser.id;
    }

    const token = await createToken(
      { userId, email: payload.email },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: userId,
        email: payload.email,
        name: payload.name ?? null,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
});

auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonUnauthorized(c, 'Unauthorized');
    }

    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as { userId: string };
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
    )
      .bind(payload.userId)
      .first();

    if (!user) {
      return jsonNotFound(c, 'User not found');
    }

    return c.json(user);
  } catch {
    return jsonUnauthorized(c, 'Unauthorized');
  }
});

export default auth;
