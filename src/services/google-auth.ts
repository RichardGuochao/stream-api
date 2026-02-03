import { OAuth2Client } from 'google-auth-library';

export interface GoogleTokenPayload {
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string
): Promise<GoogleTokenPayload | null> {
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  return payload ?? null;
}
