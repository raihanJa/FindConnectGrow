/* Browser Supabase client for the admin portal: keeps the signed-in session (localStorage, prefix fcg:).
   Writes are only allowed for accounts listed in public.admins (RLS + create_talent RPC). */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/** Admins sign in with a username; Supabase Auth stores it as <username>@fcg.example. */
export const ADMIN_DOMAIN = 'fcg.example';
export const usernameToEmail = (u: string) => (u.includes('@') ? u : `${u}@${ADMIN_DOMAIN}`).trim().toLowerCase();

let client: SupabaseClient<Database> | null = null;
export function browserSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)');
  client = createClient<Database>(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'fcg:auth' } });
  return client;
}
