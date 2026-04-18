import { createServiceClient } from '@/lib/supabase';
import { getUserId, ok, err } from '@/lib/api-helpers';

export async function POST(req: Request): Promise<Response> {
  // 1. Auth
  const userId = getUserId(req);
  if (!userId) {
    return err('Unauthorized', 401);
  }

  // 2. Parse + validate request body
  let body: { bookingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return err('Invalid request body', 400);
  }

  const { bookingId } = body;
  if (typeof bookingId !== 'string' || !bookingId) {
    return err('bookingId is required', 400);
  }

  const supabase = createServiceClient();

  // 3. Call check_in_booking RPC
  const { data, error } = await supabase.rpc('check_in_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
  });

  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('check_in_not_found')) {
      return Response.json({ message: '找不到預約' }, { status: 404 });
    }
    if (msg.includes('check_in_already_done')) {
      return Response.json({ message: '已完成打卡' }, { status: 409 });
    }
    if (msg.includes('check_in_cancelled')) {
      return Response.json({ message: '預約已取消' }, { status: 409 });
    }
    if (msg.includes('check_in_time_invalid')) {
      return Response.json(
        { message: '不在打卡時間範圍內（預約時間前後 2 小時）' },
        { status: 400 }
      );
    }
    console.error('[api/check-in] rpc error:', error);
    return err('Internal server error', 500);
  }

  // 4. Return new points total
  return ok({ newPoints: data as number });
}
