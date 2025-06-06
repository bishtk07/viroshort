# Cloudflare Pages Deployment Guide for Viroshort

This guide will help you deploy your Viroshort AI video generation platform to Cloudflare Pages with Supabase as the backend.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Supabase Project**: Set up at [supabase.com](https://supabase.com)
4. **API Keys**: Obtain keys from:
   - OpenAI (GPT-4)
   - Replicate (Image Generation)
   - ElevenLabs (Voice Synthesis)

## Step 1: Prepare Your Repository

Your project has been configured for Cloudflare deployment with:
- ✅ `@astrojs/cloudflare` adapter
- ✅ `wrangler.toml` configuration
- ✅ Updated build scripts
- ✅ Environment variables setup

## Step 2: Deploy to Cloudflare Pages

### Option A: Using Cloudflare Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to "Pages" → "Create a project"
   - Select "Connect to Git"
   - Choose your GitHub repository

2. **Configure Build Settings**:
   ```
   Framework preset: Astro
   Build command: npm run build
   Build output directory: dist
   Root directory: (leave empty)
   ```

3. **Environment Variables**:
   Add these in the Cloudflare Pages dashboard:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   REPLICATE_API_TOKEN=your_replicate_api_token
   ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
   RANDI_API_KEY=your_randi_api_key (optional)
   NODE_ENV=production
   ```

4. **Deploy**: Click "Save and Deploy"

### Option B: Using Wrangler CLI

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Login to Cloudflare**:
   ```bash
   npx wrangler login
   ```

3. **Build and Deploy**:
   ```bash
   npm run deploy
   ```

## Step 3: Configure Supabase

Your project already uses Supabase. Ensure your Supabase project is properly configured:

1. **Database Setup**: Your migrations should be in the `supabase/migrations` directory
2. **API Keys**: Get your project URL and anon key from Supabase dashboard
3. **CORS Settings**: Add your Cloudflare Pages domain to allowed origins

## Step 4: Configure Custom Domain (Optional)

1. In Cloudflare Pages, go to "Custom domains"
2. Add your domain
3. Update DNS records as instructed

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | ✅ |
| `REPLICATE_API_TOKEN` | Replicate API token for image generation | ✅ |
| `ELEVEN_LABS_API_KEY` | ElevenLabs API key for voice synthesis | ✅ |
| `RANDI_API_KEY` | Optional API key | ❌ |
| `NODE_ENV` | Environment (production) | ✅ |

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Ensure Node.js version is 18.x
   - Check that all dependencies are installed
   - Verify environment variables are set

2. **API Errors**:
   - Confirm all API keys are valid
   - Check API rate limits
   - Verify Supabase connection

3. **Routing Issues**:
   - Astro's SSR mode requires server-side rendering
   - Ensure all API routes are working

### Performance Optimization:

1. **Caching**: Cloudflare automatically caches static assets
2. **Edge Functions**: API routes run on Cloudflare's edge network
3. **Image Optimization**: Consider using Cloudflare Images for generated content

## Features Enabled:

- ✅ **Server-Side Rendering**: Full SSR support with Cloudflare adapter
- ✅ **Edge Computing**: API routes run on Cloudflare's global network
- ✅ **Automatic HTTPS**: SSL certificates included
- ✅ **Global CDN**: Fast content delivery worldwide
- ✅ **Analytics**: Built-in Cloudflare analytics
- ✅ **Auto Deployments**: Deploy on every git push

## Support

- **Cloudflare Docs**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Astro Cloudflare Guide**: [docs.astro.build/en/guides/deploy/cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

Your Viroshort platform is now ready for Cloudflare Pages deployment! 🚀 