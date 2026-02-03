import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { jsonUnauthorized } from '../utils/response';
import type { Bindings } from '../types';

export type AuthVariables = {
  userId: string;
};

export async function authMiddleware(c: Context<{ Bindings: Bindings; Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonUnauthorized(c, 'Unauthorized');
  }

  try {
    const token = authHeader.substring(7);
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as { userId: string; email: string };
    c.set('userId', payload.userId);
    await next();
  } catch {
    return jsonUnauthorized(c, 'Unauthorized');
  }
}
