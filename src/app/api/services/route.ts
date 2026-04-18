import { createServiceClient } from '@/lib/supabase';
import { ok, err } from '@/lib/api-helpers';
import type { Service } from '@/types/index';

export async function GET(_req: Request): Promise<Response> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[api/services] DB error:', error);
    return err('Failed to fetch services', 500);
  }

  return ok(data as Service[]);
}
