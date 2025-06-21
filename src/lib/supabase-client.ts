import { createClient } from '@supabase/supabase-js';

// Use the same credentials
const supabaseUrl = 'https://ihcpenmluoolrokmjufy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloY3Blbm1sdW9vbHJva21qdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDkzMzUsImV4cCI6MjA2MDQ4NTMzNX0.C0a7e2DDZEzmDadb3CSlX_QGhAO-_1ie-kKQmv4wEOs';

// Custom cookie storage for server-side compatibility - matches landing page exactly
const cookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    // Set cookie with proper attributes for server access
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }
};

// Create a simple client-side Supabase client with same config as landing page
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: cookieStorage, // Use custom cookie storage
    storageKey: 'supabase-auth-token' // Same key as landing page
  }
});

// Also export as supabaseClient for compatibility
export const supabaseClient = supabase;

// Debug authentication state
if (typeof window !== 'undefined') {
  console.log('🔐 Client-side Supabase initialized');
  
  // Check authentication state immediately
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('❌ Error getting session:', error);
    } else if (session) {
      console.log('✅ User authenticated:', session.user?.email);
      console.log('📍 Access token:', session.access_token?.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No active session');
      
      // Check if cookie exists
      const authCookie = cookieStorage.getItem('supabase-auth-token');
      if (authCookie) {
        console.log('🍪 Cookie exists but session not restored');
      } else {
        console.log('🍪 No auth cookie found');
      }
    }
  });
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event);
    if (session) {
      console.log('✅ Session active:', session.user?.email);
    } else {
      console.log('⚠️ No session');
    }
  });
} 