/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'framer-motion' {
  export * from 'framer-motion/types'
}

declare module 'lucide-react' {
  export * from 'lucide-react/dist/types'
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly REPLICATE_API_TOKEN: string;
  readonly ELEVEN_LABS_API_KEY: string;
  readonly RANDI_API_KEY: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 