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
    const res = await fetch(
      `${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`
    );
    console.log('google auth response: ', res);
    if (!res.ok) {
      return null;
    }
    const payload = (await res.json()) as GoogleTokenPayload & { aud?: string };
    if (payload.aud !== clientId) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
