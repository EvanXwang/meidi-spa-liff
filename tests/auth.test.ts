import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { signJwt, verifyJwt, getBearerToken } from '@/lib/auth';
import jwt from 'jsonwebtoken';

describe('signJwt', () => {
  it('returns a string', () => {
    expect(typeof signJwt('abc')).toBe('string');
  });
});

describe('verifyJwt', () => {
  it('returns sub on valid token', () => {
    const userId = 'user-123';
    const token = signJwt(userId);
    const result = verifyJwt(token);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe(userId);
  });

  it('returns null on tampered token', () => {
    const token = signJwt('user-456');
    const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
    expect(verifyJwt(tampered)).toBeNull();
  });

  it('returns null on expired token', () => {
    const secret = process.env.SUPABASE_JWT_SECRET!;
    const expiredToken = jwt.sign(
      {
        sub: 'user-789',
        role: 'authenticated',
        iss: 'supabase',
        exp: Math.floor(Date.now() / 1000) - 1,
      },
      secret,
      { algorithm: 'HS256' }
    );
    expect(verifyJwt(expiredToken)).toBeNull();
  });

  it('returns null on garbage input', () => {
    expect(verifyJwt('not.a.jwt')).toBeNull();
  });
});

describe('getBearerToken', () => {
  it('extracts token from valid Authorization header', () => {
    const req = new Request('http://x', {
      headers: { Authorization: 'Bearer mytoken' },
    });
    expect(getBearerToken(req)).toBe('mytoken');
  });

  it('returns null for missing Authorization header', () => {
    const req = new Request('http://x');
    expect(getBearerToken(req)).toBeNull();
  });

  it('returns null for non-Bearer scheme', () => {
    const req = new Request('http://x', {
      headers: { Authorization: 'Basic foo' },
    });
    expect(getBearerToken(req)).toBeNull();
  });
});
