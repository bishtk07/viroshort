import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    tailwind({
      applyBaseStyles: false,
      config: {
        applyBaseStyles: false,
        darkMode: 'class'
      }
    }),
    react()
  ],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    runtime: {
      mode: 'local',
      type: 'pages'
    }
  }),
  server: {
    port: 4321,
    host: true
  },
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js']
    },
    define: {
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY),
      'import.meta.env.ELEVEN_LABS_API_KEY': JSON.stringify(process.env.ELEVEN_LABS_API_KEY)
    }
  }
}); 