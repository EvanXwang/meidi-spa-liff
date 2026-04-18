import { createServiceClient } from '@/lib/supabase';
import { getUserId, ok, err } from '@/lib/api-helpers';
import type { TodayBooking } from '@/types/index';

export async function GET(req: Request): Promise<Response> {
  // 1. Auth
  const userId = getUserId(req);
  if (!userId) {
    return err('Unauthorized', 401);
  }

  const supabase = createServiceClient();

  // 2. Fetch next upcoming booking within a 3-hour lookback window
  //    so users can still see/check-in slightly past start time
  const lookback = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select('id, scheduled_start, scheduled_end, status, service:services(name, duration), therapist:therapists(name, title)')
    .eq('user_id', userId)
    .eq('status', 'booked')
    .gt('scheduled_start', lookback)
    .order('scheduled_start', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[api/today] fetch error:', error);
    return err('Failed to fetch today\'s booking', 500);
  }

  const booking = (data && data.length > 0 ? data[0] : null) as TodayBooking | null;

  return ok({ booking });
}
