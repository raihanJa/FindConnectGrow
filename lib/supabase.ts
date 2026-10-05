/* Supabase client — publishable key only: visitors can read public content and submit forms (RLS enforced). */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example)');

export const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
