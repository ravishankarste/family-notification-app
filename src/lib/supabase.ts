
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rkzjcyiqphodkkwgrdmu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrempjeWlxcGhvZGtrd2dyZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTk1MDAsImV4cCI6MjA5MzkzNTUwMH0.mxdHSOlx2VmMk_3bpd1_ij6EnnidqmchuDRh28Qy7rk';

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY_LEN:', supabaseAnonKey ? supabaseAnonKey.length : 0);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
