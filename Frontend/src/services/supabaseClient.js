import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars via import.meta.env. For frontend builds these must be prefixed with VITE_.
// Use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or host env.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in environment');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
