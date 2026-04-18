import { createServiceClient } from '@/lib/supabase';
import { getUserId, ok, err } from '@/lib/api-helpers';
import type { UserProfile, Wallet, Booking, Service, Therapist, CourseBalance } from '@/types/index';

export async function GET(req: Request): Promise<Response> {
  // 1. Auth
  const userId = getUserId(req);
  if (!userId) {
    return err('Unauthorized', 401);
  }

  const supabase = createServiceClient();

  // 2. Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    console.error('[api/me] profile fetch error:', profileError);
    return err('User not found', 404);
  }

  const profile = profileData as UserProfile;

  // 3. Fetch wallet
  const { data: walletData, error: walletError } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (walletError || !walletData) {
    console.error('[api/me] wallet fetch error:', walletError);
    return err('Wallet not found', 404);
  }

  const wallet = walletData as Wallet;

  // 4. Fetch upcoming bookings (joined with services + therapists)
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('*, service:services(*), therapist:therapists(*)')
    .eq('user_id', userId)
    .eq('status', 'booked')
    .gt('scheduled_start', new Date().toISOString())
    .order('scheduled_start', { ascending: true })
    .limit(3);

  if (bookingsError) {
    console.error('[api/me] bookings fetch error:', bookingsError);
    return err('Failed to fetch bookings', 500);
  }

  const upcomingBookings = (bookingsData ?? []) as Array<
    Booking & { service: Service; therapist: Therapist | null }
  >;

  // 5. Fetch course balances (joined with services)
  const { data: courseData, error: courseError } = await supabase
    .from('course_balance')
    .select('*, service:services(*)')
    .eq('user_id', userId)
    .gt('remaining', 0);

  if (courseError) {
    console.error('[api/me] course_balance fetch error:', courseError);
    return err('Failed to fetch course balances', 500);
  }

  const courseBalances = (courseData ?? []) as Array<CourseBalance & { service: Service }>;

  return ok({ profile, wallet, upcomingBookings, courseBalances });
}
