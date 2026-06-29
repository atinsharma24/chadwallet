import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

// Supabase is used as an auth/data backup layer (mirroring Privy users and
// caching token watchlists). It is optional: if not configured we export null
// and callers no-op.
export const supabase: SupabaseClient | null =
  ENV.supabaseUrl && ENV.supabaseAnonKey
    ? createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
