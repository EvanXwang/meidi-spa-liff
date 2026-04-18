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

describe('init_new_user integration', () => {
  let createdUserId: string | null = null;

  afterEach(async () => {
    if (createdUserId) {
      const { error } = await supabase.from('users').delete().eq('id', createdUserId);
      if (error) console.warn('Cleanup failed for user', createdUserId, error.message);
      createdUserId = null;
    }
  });

  it('seeds wallet, course_balance (×2), and a booked booking for a new user', async () => {
    // 1. Create a fake user
    const lineUserId = `test_${Date.now()}`;
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .insert({ line_user_id: lineUserId, display_name: 'Test User' })
      .select('id')
      .single();

    expect(userErr).toBeNull();
    expect(userRow).not.toBeNull();
    createdUserId = userRow!.id;

    // 2. Call init_new_user
    const { error: rpcErr } = await supabase.rpc('init_new_user', {
      p_user_id: createdUserId,
    });
    expect(rpcErr).toBeNull();

    // 3. Assert wallet row
    const { data: walletRow, error: walletErr } = await supabase
      .from('wallet')
      .select('storage_value, points')
      .eq('user_id', createdUserId)
      .single();

    expect(walletErr).toBeNull();
    expect(walletRow).not.toBeNull();
    expect(walletRow!.storage_value).toBe(12500);
    expect(walletRow!.points).toBe(8);

    // 4. Assert course_balance has 2 rows
    const { data: courseRows, error: courseErr } = await supabase
      .from('course_balance')
      .select('remaining')
      .eq('user_id', createdUserId);

    expect(courseErr).toBeNull();
    expect(courseRows).toHaveLength(2);
    // Remaining values should be 5 and 2 (order-independent check)
    const remainingValues = courseRows!.map(r => r.remaining).sort();
    expect(remainingValues).toContain(5);
    expect(remainingValues).toContain(2);

    // 5. Assert bookings has 1 row with status='booked'
    const { data: bookingRows, error: bookingErr } = await supabase
      .from('bookings')
      .select('status, scheduled_start, scheduled_end')
      .eq('user_id', createdUserId);

    expect(bookingErr).toBeNull();
    expect(bookingRows).toHaveLength(1);
    expect(bookingRows![0].status).toBe('booked');

    // scheduled_start should be ~5 days from now (within a 1-day tolerance)
    const start = new Date(bookingRows![0].scheduled_start);
    const now = new Date();
    const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(4);
    expect(diffDays).toBeLessThan(6);

    // scheduled_end should be after scheduled_start
    const end = new Date(bookingRows![0].scheduled_end);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});
