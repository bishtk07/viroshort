# 🎬 ViroShort - AI Video Generator with Credit System

An advanced AI-powered video generation platform that creates viral-style short videos with synchronized captions, motion effects, and precise audio timing. Now includes a comprehensive credit-based billing system.

![ViroShort Demo](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=ViroShort+AI+Video+Generator)

## 🚀 New Features

### ✅ **Credit-Based Billing System**
- **Free Trial**: New users get 1 free credit to test the app
- **Per-video billing**: 1 credit consumed per video generation
- **Real-time balance**: Credit balance visible in navigation
- **Automatic blocking**: Users can't generate videos without credits
- **Paddle integration**: Seamless subscription management

### 🎯 **Subscription Plans**
- **Free**: 1 credit (new users only)
- **Starter**: 15 credits/month or 3 credits/week ($19/month or $7.50/week)
- **Daily**: 30 credits/month or 7 credits/week ($39/month or $15/week)
- **Hardcore**: 60 credits/month or 15 credits/week ($69/month or $26/week)

### ✅ **Perfect Audio-Video Synchronization**
- **Aegisub-style timing**: Precise frame-by-frame synchronization
- **Real-time debugging**: Visual overlays showing timing information
- **Multi-image support**: Each segment uses the correct image at the right time
- **Motion effects**: Smooth transitions with zoom, pan, and rotation effects

### 🎬 **Advanced Video Generation**
- **Multiple aspect ratios**: 9:16 (TikTok/Instagram), 16:9 (YouTube), 1:1 (Square)
- **CapCut-style captions**: Professional viral caption styles with emojis
- **Smart image distribution**: Automatic segmentation based on audio duration
- **High-quality rendering**: 30 FPS with precise timing control

### 🎯 **Intelligent Caption System**
- **Word-level synchronization**: 2.2 words per second natural speech rate
- **Smart timing**: Realistic pauses and breathing room
- **Multiple styles**: Neon, Classic, Fire, Ice, Gold, Blue-tech
- **Emoji integration**: Contextual emoji insertion (35% of captions)

### 🔐 **Security & User Management**
- **Row Level Security**: Each user can only access their own data
- **Authentication required**: All video generation requires login
- **Credit tracking**: Complete audit trail of all credit transactions
- **Automatic provisioning**: New users automatically receive free credit

## 📋 Requirements

- Node.js 18+ 
- Modern web browser with Canvas API support
- Supabase account (for database and authentication)
- Paddle account (for billing)
- API Keys:
  - OpenAI API key (for script generation)
  - Fish Audio API key (for text-to-speech)
  - Replicate API key (for image generation)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd viroshort
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file based on `.env.example`:
```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Service APIs
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_token
FISH_AUDIO_API_KEY=your_fish_audio_api_key

# Paddle Configuration (for billing)
PADDLE_VENDOR_ID=your_paddle_vendor_id
PADDLE_API_KEY=your_paddle_api_key
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret

# Environment
NODE_ENV=development
```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Set up authentication providers (optional: Google, GitHub)

5. **Configure Paddle**
   - Set up subscription products and pricing
   - Configure webhook URL: `https://your-domain.com/api/paddle-webhook`
   - Add environment variables to your hosting platform

6. **Start the development server**
```bash
npm run dev
```

7. **Open your browser**
Navigate to `http://localhost:4321`

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. **Build the project**
```bash
npm run build
```

2. **Deploy to Cloudflare Pages**
- Connect your GitHub repository to Cloudflare Pages
- Set build command: `npm run build`
- Set output directory: `dist`
- Add all environment variables in Cloudflare dashboard

### Environment Variables for Production

Make sure to set these in your Cloudflare Pages environment:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `FISH_AUDIO_API_KEY`
- `PADDLE_VENDOR_ID`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `NODE_ENV=production`

## 🎮 Usage

### For New Users
1. **Sign up** - Get 1 free credit automatically
2. **Generate your first video** - Test the platform
3. **Upgrade your plan** - Get more credits to continue

### For Subscribers
1. **Choose your plan** - Weekly or monthly billing
2. **Generate videos** - 1 credit per video
3. **Monitor usage** - Track credits in navigation
4. **Auto-renewal** - Credits refresh each billing cycle

## 🛠️ Technical Architecture

### Database Schema
- **user_credits**: Tracks credit balance per user
- **credit_transactions**: Audit trail of all credit operations
- **subscription_plans**: Plan details and pricing
- **user_subscriptions**: User subscription status
- **videos**: Generated video metadata

### Credit System Flow
1. **New user signup** → 1 free credit granted
2. **Video generation** → 1 credit consumed
3. **Subscription activation** → Credits granted per plan
4. **Billing renewal** → Credits refreshed

### API Protection
- All video generation endpoints require authentication
- Credit check before processing
- Automatic credit consumption
- Error handling for insufficient credits

## 📊 Performance Metrics

- **Rendering Speed**: ~30 FPS real-time generation
- **Audio Sync Accuracy**: ±50ms precision
- **Memory Usage**: Optimized for large image sets
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge
- **Credit System**: Sub-second response times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper debugging
4. Test the credit system thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🆘 Support

- **Issues**: Create a GitHub issue with debug console output
- **Features**: Submit feature requests with use cases
- **Documentation**: Contribute to improve this README

---

**⚡ Latest Updates**
- ✅ Implemented comprehensive credit system
- ✅ Added Paddle billing integration
- ✅ Created user-specific credit tracking
- ✅ Added real-time credit balance display
- ✅ Implemented automatic credit provisioning
- ✅ Added subscription management

## 🎯 Credit System Features

- **Free Trial**: 1 credit for new users
- **Real-time Tracking**: Credit balance always visible
- **Automatic Blocking**: Can't generate without credits
- **Audit Trail**: Complete transaction history
- **Flexible Plans**: Weekly and monthly options
- **Webhook Integration**: Automatic credit grants on subscription

## 🔗 Links

- [Live Demo](https://your-domain.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Paddle Dashboard](https://vendors.paddle.com)
- [API Documentation](https://your-domain.com/docs)
