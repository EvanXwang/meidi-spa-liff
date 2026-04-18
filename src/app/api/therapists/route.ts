import { createServiceClient } from '@/lib/supabase';
import { ok, err } from '@/lib/api-helpers';
import type { Therapist } from '@/types/index';

export async function GET(_req: Request): Promise<Response> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('therapists')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api/therapists] DB error:', error);
    return err('Failed to fetch therapists', 500);
  }

  return ok(data as Therapist[]);
}
