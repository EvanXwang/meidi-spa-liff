import { getBearerToken, verifyJwt } from '@/lib/auth';

/**
 * Parse and verify Bearer JWT from the request.
 * Returns the userId (sub claim) on success, or null if missing/invalid.
 */
export function getUserId(req: Request): string | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  return payload.sub;
}

/** Return a standard JSON success response. */
export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/** Return a standard JSON error response. */
export function err(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
