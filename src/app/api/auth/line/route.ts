import { createServiceClient } from '@/lib/supabase';
import { signJwt } from '@/lib/auth';

export async function POST(req: Request): Promise<Response> {
  let idToken: string;

  try {
    const body = await req.json();
    idToken = body.idToken;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!idToken) {
    return Response.json({ error: 'idToken is required' }, { status: 400 });
  }

  // 1. Verify LINE ID token via LINE's verify endpoint
  const channelId = process.env.LINE_CHANNEL_ID;
  if (!channelId) {
    return Response.json({ error: 'LINE_CHANNEL_ID not configured' }, { status: 500 });
  }

  let lineSub: string;
  let lineDisplayName: string;
  let linePictureUrl: string;

  try {
    const verifyParams = new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    });

    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    if (!verifyRes.ok) {
      return Response.json({ error: 'LINE token verification failed' }, { status: 401 });
    }

    const payload = await verifyRes.json();
    if (!payload.sub) {
      return Response.json({ error: 'LINE token missing sub claim' }, { status: 401 });
    }

    lineSub = payload.sub as string;
    lineDisplayName = (payload.name as string) ?? '';
    linePictureUrl = (payload.picture as string) ?? '';
  } catch {
    return Response.json({ error: 'Failed to verify LINE token' }, { status: 500 });
  }

  // 2. Upsert user in Supabase users table
  const supabase = createServiceClient();

  const { data: upsertedUser, error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        line_user_id: lineSub,
        display_name: lineDisplayName,
        picture_url: linePictureUrl,
      },
      { onConflict: 'line_user_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  if (upsertError || !upsertedUser) {
    console.error('[auth/line] upsert error:', upsertError);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }

  const internalUserId: string = upsertedUser.id;

  // 3. Check if wallet row exists; if not, initialise for new user
  const { data: walletRow } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', internalUserId)
    .maybeSingle();

  if (!walletRow) {
    const { error: rpcError } = await supabase.rpc('init_new_user', {
      p_user_id: internalUserId,
    });
    if (rpcError) {
      console.error('[auth/line] init_new_user error:', rpcError);
      // Non-fatal: log but continue
    }
  }

  // 4. Sign and return custom JWT
  const token = signJwt(internalUserId);

  return Response.json({ token, userId: internalUserId });
}
