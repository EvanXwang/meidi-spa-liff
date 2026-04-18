/**
 * Dev-only endpoint: resets a user's demo data to initial seeded state.
 * Only enabled when ENABLE_DEV_ENDPOINTS=true.
 * Requires a valid JWT (same as all protected routes).
 */
import { createServiceClient } from '@/lib/supabase';
import { getUserId, ok, err } from '@/lib/api-helpers';

export async function POST(req: Request): Promise<Response> {
  if (process.env.ENABLE_DEV_ENDPOINTS !== 'true') {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const userId = getUserId(req);
  if (!userId) {
    return err('Unauthorized', 401);
  }

  const supabase = createServiceClient();

  // 1. Delete all bookings for user (cascade will handle point_logs)
  const { error: bookingsError } = await supabase
    .from('bookings')
    .delete()
    .eq('user_id', userId);

  if (bookingsError) {
    console.error('[api/dev/reset-me] delete bookings error:', bookingsError);
    return err('Failed to reset bookings', 500);
  }

  // 2. Delete course_balance rows for user
  const { error: courseError } = await supabase
    .from('course_balance')
    .delete()
    .eq('user_id', userId);

  if (courseError) {
    console.error('[api/dev/reset-me] delete course_balance error:', courseError);
    return err('Failed to reset course balances', 500);
  }

  // 3. Delete wallet row for user
  const { error: walletError } = await supabase
    .from('wallet')
    .delete()
    .eq('user_id', userId);

  if (walletError) {
    console.error('[api/dev/reset-me] delete wallet error:', walletError);
    return err('Failed to reset wallet', 500);
  }

  // 4. Re-seed demo data via init_new_user RPC
  const { error: rpcError } = await supabase.rpc('init_new_user', { p_user_id: userId });

  if (rpcError) {
    console.error('[api/dev/reset-me] init_new_user rpc error:', rpcError);
    return err('Failed to re-initialize user data', 500);
  }

  return ok({ reset: true });
}
