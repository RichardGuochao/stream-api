import { sign, verify } from 'hono/jwt';

const DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createToken(
  payload: { userId: string; email: string; [key: string]: unknown },
  secret: string,
  expiresIn = DEFAULT_EXPIRY_SECONDS
) {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    },
    secret,
    'HS256'
  );
}

export async function verifyToken<T = { userId: string; email: string }>(
  token: string,
  secret: string
): Promise<T> {
  return verify(token, secret, 'HS256') as Promise<T>;
}
