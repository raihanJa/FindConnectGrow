'use server';
/* Refresh the statically rendered pages right after an admin adds a talent (instead of waiting for ISR). */
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/database.types';

export async function revalidateSite(accessToken: string) {
  const sb = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
  const { data } = await sb.rpc('is_admin');
  if (data !== true) return false;
  revalidatePath('/', 'layout');
  return true;
}
