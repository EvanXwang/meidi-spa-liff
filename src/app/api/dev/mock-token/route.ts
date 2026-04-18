/**
 * Dev-only endpoint: returns a signed JWT for a mock user.
 * Only enabled when ENABLE_DEV_ENDPOINTS=true.
 * Never deploy to production without that guard.
 */
import { signJwt } from '@/lib/auth';

export async function POST(req: Request): Promise<Response> {
  if (process.env.ENABLE_DEV_ENDPOINTS !== 'true') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  let userId = 'dev-user-001';
  try {
    const body = await req.json();
    if (body?.userId) userId = body.userId;
  } catch {
    // Use default userId
  }

  const token = signJwt(userId);
  return Response.json({ token, userId });
}
