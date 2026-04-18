import jwt from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not set');
  }
  return secret;
}

export function signJwt(userId: string): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      role: 'authenticated',
      iss: 'supabase',
      exp: now + 7 * 24 * 60 * 60,
    },
    secret,
    { algorithm: 'HS256' }
  );
}

export function verifyJwt(token: string): { sub: string } | null {
  try {
    const secret = getSecret();
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (typeof payload.sub !== 'string') return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}
