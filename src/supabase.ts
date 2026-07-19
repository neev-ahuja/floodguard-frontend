import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if keys are present
export const supabasePublic = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabasePublic) {
  console.warn(
    '[Supabase Public] Realtime subscriptions disabled. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are missing. Falling back to HTTP polling.'
  );
}
