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
    }
  }),
  server: {
    port: 4321,
    host: true
  },
  vite: {
    ssr: {
      noExternal: ['@supabase/supabase-js']
    }
  }
}); 