import type { Context } from 'hono';

/** HTTP status codes used by response helpers (Hono expects literal types) */
type ResponseStatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export function jsonSuccess<T>(c: Context, data: T, status: ResponseStatusCode = 200) {
  return c.json(data, status);
}

export function jsonError(c: Context, message: string, status: ResponseStatusCode = 400) {
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
