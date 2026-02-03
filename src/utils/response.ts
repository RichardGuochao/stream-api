import type { Context } from 'hono';

export function jsonSuccess<T>(c: Context, data: T, status = 200) {
  return c.json(data, status);
}

export function jsonError(c: Context, message: string, status = 400) {
  return c.json({ error: message }, status);
}

export function jsonNotFound(c: Context, message = 'Not found') {
  return c.json({ error: message }, 404);
}

export function jsonUnauthorized(c: Context, message = 'Unauthorized') {
  return c.json({ error: message }, 401);
}

export function jsonForbidden(c: Context, message = 'Forbidden') {
  return c.json({ error: message }, 403);
}
