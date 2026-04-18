import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env.local (Next.js convention) — dotenv/config only reads .env
config({ path: resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, afterEach } from 'vitest';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function createTestUser(): Promise<string> {
  const lineUserId = `test_checkin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const { data: userRow, error } = await supabase
    .from('users')
    .insert({ line_user_id: lineUserId, display_name: 'Test CheckIn User' })
    .select('id')
    .single();
  if (error) throw new Error(`createTestUser failed: ${error.message}`);
  return userRow!.id;
}

async function initUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('init_new_user', { p_user_id: userId });
  if (error) throw new Error(`init_new_user failed: ${error.message}`);
}

async function getBookingId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(`getBookingId failed: ${error.message}`);
  return data!.id;
}

describe('check_in_booking integration', () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdUserIds.splice(0)) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) console.warn('Cleanup failed for user', id, error.message);
    }
  });

  it('happy path: checks in, awards 10 points, logs point_log', async () => {
    const userId = await createTestUser();
    createdUserIds.push(userId);
    await initUser(userId);

    const bookingId = await getBookingId(userId);

    // Move scheduled_start to now so it's within the ±2 hour window
    await supabase
      .from('bookings')
      .update({
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 90 * 60000).toISOString(),
      })
      .eq('id', bookingId);

    const { data: points, error: rpcErr } = await supabase.rpc('check_in_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    expect(rpcErr).toBeNull();
    expect(points).toBeGreaterThanOrEqual(10);

    // Assert booking status = 'checked_in'
    const { data: booking } = await supabase
      .from('bookings')
      .select('status, checked_in_at')
      .eq('id', bookingId)
      .single();
    expect(booking!.status).toBe('checked_in');
    expect(booking!.checked_in_at).not.toBeNull();

    // Assert point_logs has 1 row with delta=10, reason='check_in'
    const { data: logs } = await supabase
      .from('point_logs')
      .select('delta, reason, booking_id')
      .eq('user_id', userId)
      .eq('reason', 'check_in');
    expect(logs).toHaveLength(1);
    expect(logs![0].delta).toBe(10);
    expect(logs![0].reason).toBe('check_in');
    expect(logs![0].booking_id).toBe(bookingId);
  });

  it('wrong user: returns check_in_not_found error', async () => {
    const userId1 = await createTestUser();
    createdUserIds.push(userId1);
    const userId2 = await createTestUser();
    createdUserIds.push(userId2);

    await initUser(userId1);
    await initUser(userId2);

    const bookingId = await getBookingId(userId1);

    // Move booking to now so time check doesn't interfere
    await supabase
      .from('bookings')
      .update({
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 90 * 60000).toISOString(),
      })
      .eq('id', bookingId);

    const { error } = await supabase.rpc('check_in_booking', {
      p_booking_id: bookingId,
      p_user_id: userId2,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain('check_in_not_found');
  });

  it('already checked in: returns check_in_already_done error', async () => {
    const userId = await createTestUser();
    createdUserIds.push(userId);
    await initUser(userId);

    const bookingId = await getBookingId(userId);

    await supabase
      .from('bookings')
      .update({
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 90 * 60000).toISOString(),
      })
      .eq('id', bookingId);

    // First check-in (should succeed)
    const { error: firstErr } = await supabase.rpc('check_in_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });
    expect(firstErr).toBeNull();

    // Second check-in (should fail)
    const { error: secondErr } = await supabase.rpc('check_in_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });
    expect(secondErr).not.toBeNull();
    expect(secondErr!.message).toContain('check_in_already_done');
  });

  it('time invalid: booking 5 days in future returns check_in_time_invalid error', async () => {
    const userId = await createTestUser();
    createdUserIds.push(userId);
    await initUser(userId);

    // init_new_user already creates a booking 5 days in future — no time manipulation needed
    const bookingId = await getBookingId(userId);

    const { error } = await supabase.rpc('check_in_booking', {
      p_booking_id: bookingId,
      p_user_id: userId,
    });

    expect(error).not.toBeNull();
    expect(error!.message).toContain('check_in_time_invalid');
  });
});
