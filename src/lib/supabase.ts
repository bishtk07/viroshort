import { createClient } from '@supabase/supabase-js';

// Use the same credentials as the landing page
const supabaseUrl = 'https://ihcpenmluoolrokmjufy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloY3Blbm1sdW9vbHJva21qdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MDkzMzUsImV4cCI6MjA2MDQ4NTMzNX0.C0a7e2DDZEzmDadb3CSlX_QGhAO-_1ie-kKQmv4wEOs';

// Create the Supabase client (server-side, no special storage needed)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Server-side doesn't need auto-refresh
    persistSession: false,   // Server-side doesn't persist sessions
    detectSessionInUrl: false
  }
});

// Export the client
export { supabase };

// Helper function to get supabase client with error handling
export function getSupabaseClient() {
  return supabase;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          title: string;
          tone: string;
          genre: string;
          base_prompt: string;
        };
        Insert: {
          id?: string;
          title: string;
          tone: string;
          genre: string;
          base_prompt: string;
        };
        Update: {
          id?: string;
          title?: string;
          tone?: string;
          genre?: string;
          base_prompt?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          template?: string;
          customizations?: any;
          script?: string;
          images?: string[];
          voice_url?: string;
          final_url?: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          template?: string;
          customizations?: any;
          script?: string;
          images?: string[];
          voice_url?: string;
          final_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          template?: string;
          customizations?: any;
          script?: string;
          images?: string[];
          voice_url?: string;
          final_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      gameplay_library: {
        Row: {
          id: string;
          title: string;
          video_url: string;
          thumbnail: string;
        };
        Insert: {
          id?: string;
          title: string;
          video_url: string;
          thumbnail: string;
        };
        Update: {
          id?: string;
          title?: string;
          video_url?: string;
          thumbnail?: string;
        };
      };
    };
  };
}; 