import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser client — uses anon key.
 * For use in Client Components only.
 */
export function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

/**
 * Server client — uses service role key (bypasses RLS).
 * For use in API routes / server-side code only. Never expose to the browser.
 */
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}
