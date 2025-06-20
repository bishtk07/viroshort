import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Create a conditional client that doesn't fail during build
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables not found - client not initialized');
}

// Export the client with null check
export { supabase };

// Helper function to get supabase client with error handling
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
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
          type: 'shorts' | 'gameplay';
          script: string;
          images: string[];
          voice_url: string;
          final_url: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'shorts' | 'gameplay';
          script: string;
          images?: string[];
          voice_url?: string;
          final_url?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'shorts' | 'gameplay';
          script?: string;
          images?: string[];
          voice_url?: string;
          final_url?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          created_at?: string;
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