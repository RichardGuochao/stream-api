/**
 * Verify Google ID token using Google's tokeninfo endpoint.
 * Uses fetch only (no Node crypto), so it works on Cloudflare Workers.
 * @see https://developers.google.com/identity/sign-in/web/backend-auth#verify-the-integrity-of-the-id-token
 */

export interface GoogleTokenPayload {
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string
): Promise<GoogleTokenPayload | null> {
  try {
    const url = `${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`;
    console.log('[google-auth] url: ', url);
    const res = await fetch(url);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[google-auth] tokeninfo failed', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody,
      });
      return null;
    }

    const payload = (await res.json()) as GoogleTokenPayload & { aud?: string };

    if (payload.aud !== clientId) {
      console.error('[google-auth] audience mismatch', {
        expected: clientId,
        got: payload.aud,
      });
      return null;
    }

    return payload;
  } catch (error) {
    console.error('[google-auth] error:', error);
    return null;
  }
}
