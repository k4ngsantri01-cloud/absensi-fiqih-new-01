/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function clean(value: string | undefined) {
  return (value || '').trim().replace(/^"|"$/g, '').trim();
}

export function getSupabaseClient(): SupabaseClient {
  const url = clean(import.meta.env.VITE_SUPABASE_URL);
  const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error('Supabase URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan.');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

