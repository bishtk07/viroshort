import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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