# 🚀 ViroShort Cloudflare Pages Setup Guide

## ⚠️ Voice Generation Issue Fix

Your voices are not fetching on Cloudflare because the **FISH_AUDIO_API_KEY** environment variable is missing.

## 🔧 Step-by-Step Fix

### 1. 📋 Get Your Fish Audio API Key
- Go to [fish.audio](https://fish.audio)
- Sign in to your account
- Navigate to **API Settings** or **Go API**
- Copy your API key (it should start with a random string like: `e60427d6d571468fb1d084ff45748224`)

### 2. 🌐 Add Environment Variable to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Open [dash.cloudflare.com](https://dash.cloudflare.com)
   - Click on **Pages**
   - Select your **viroshort-video-generator** project

2. **Navigate to Settings**
   - Click **Settings** tab
   - Click **Environment variables**

3. **Add the Missing API Key**
   - Click **"Add variable"**
   - **Variable name**: `FISH_AUDIO_API_KEY`
   - **Value**: Your Fish Audio API key (paste the full key)
   - **Environment**: Select **Production** (and **Preview** if you want)
   - Click **"Save"**

### 3. ✅ Verify All Required Variables

Make sure you have all **3 required environment variables**:

| Variable Name | Purpose | Get From |
|---------------|---------|----------|
| `OPENAI_API_KEY` | Script generation | [platform.openai.com](https://platform.openai.com/api-keys) |
| `REPLICATE_API_TOKEN` | Image generation | [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) |
| `FISH_AUDIO_API_KEY` | Voice synthesis | [fish.audio](https://fish.audio) |

### 4. 🔄 Redeploy

After adding the environment variable:
1. Click **"Save and Deploy"** (this will trigger a new deployment)
2. Wait for the deployment to complete (usually 1-2 minutes)
3. Your voices should now load correctly!

## 🎯 Expected Results

After fixing the environment variable:
- ✅ Voices will load properly from Fish Audio
- ✅ Voice preview will work
- ✅ Audio generation will succeed
- ✅ No more "credentials expired" errors

## 🆘 Troubleshooting

### If voices still don't load:
1. **Check your Fish Audio account** - Make sure you have credits/usage remaining
2. **Verify API key** - Copy-paste the key again to avoid typos
3. **Check deployment logs** - Go to Cloudflare Pages → Functions → View logs

### If you need a new Fish Audio API key:
1. Go to [fish.audio](https://fish.audio)
2. Sign up for a new account if needed
3. Navigate to API settings
4. Generate a new API key
5. Update it in Cloudflare Pages environment variables

## 📱 Test the Fix

1. Go to your live site: `https://viroshort-video-generator.pages.dev`
2. Navigate to voice selection
3. Voices should now load from Fish Audio
4. Try voice preview - it should work!
5. Generate a complete video to test full functionality

---

**🎬 Your ViroShort app should now work perfectly with Fish Audio voices!** 