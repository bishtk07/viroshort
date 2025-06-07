# 🎬 ViroShort - AI Video Generator

Create engaging short-form videos with AI-generated images, voiceovers, and CapCut-style captions!

![ViroShort Demo](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=ViroShort+AI+Video+Generator)

## ✨ Features

- 🖼️ **AI Image Generation** - Replicate FLUX models create stunning visuals
- 🎙️ **Voice Synthesis** - Fish Audio TTS with natural-sounding voices
- 📝 **CapCut-Style Captions** - 8 professional templates with smart emojis
- 🎥 **Perfect Sync** - Audio, video, and captions perfectly timed (30.537s precision)
- ⚡ **Fast Motion Effects** - Dynamic Ken Burns, zoom, and pan animations
- 📱 **Multiple Formats** - 9:16 (TikTok), 16:9 (YouTube), and 1:1 (Instagram)
- 🎯 **Smart Segmentation** - Automatically creates 33+ caption segments
- 🚀 **Real-time Generation** - See your video come to life instantly

## 🚀 Live Demo

[🎬 Try ViroShort Now](https://viroshort-video-generator.pages.dev)

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/viroshort-video-generator.git
cd viroshort-video-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
FISH_AUDIO_API_KEY=your_fish_audio_api_key_here
```

### How to get API keys:
- **OpenAI**: Sign up at [platform.openai.com](https://platform.openai.com) → API Keys → Create new secret key
- **Replicate**: Sign up at [replicate.com](https://replicate.com) → Account → API Tokens
- **Fish Audio**: Sign up at [fish.audio](https://fish.audio) → Go API → Get API Key

## 📱 How It Works

1. **📝 Enter Your Script** - Write your video content (up to 30 seconds)
2. **🎨 Choose Caption Style** - Select from 8 CapCut-inspired templates
3. **📐 Pick Aspect Ratio** - 9:16 for TikTok, 16:9 for YouTube, 1:1 for Instagram
4. **🤖 AI Generation** - Watch as AI creates:
   - 7 unique images based on your script
   - Natural voiceover with perfect timing
   - 33+ synced caption segments with emojis
5. **📥 Download** - Get your professional video ready for social media

## 🎨 Caption Styles

| Style | Description | Perfect For |
|-------|-------------|-------------|
| **Default** | Classic black background, white text | Universal content |
| **STYLE** | Neon yellow glow effect | Tech/Gaming videos |
| **BROWN** | Bold brown background | Educational content |
| **FOX** | Modern white background, black text | Clean, professional |
| **Minimal** | Clean and subtle | Minimalist aesthetic |
| **Gradient** | Professional gradient background | Premium content |
| **RED** | Bold red background | High-energy videos |
| **TECH** | Blue tech style | Technology topics |

## 🔄 Technical Details

### Video Generation Process:
1. **Script Analysis** - AI breaks down your script into visual segments
2. **Image Creation** - 7 unique images generated via Replicate FLUX
3. **Audio Synthesis** - Fish Audio creates natural voiceover (30.537s duration)
4. **Caption Generation** - 33+ word-level timed segments with smart emojis
5. **Motion Effects** - Each image gets unique animation (Ken Burns, zoom, pan)
6. **Perfect Sync** - All elements timed to 4.362s per image

### Performance Stats:
- ⚡ **Image Generation**: ~45 seconds for 7 images
- 🎙️ **Voice Synthesis**: ~10 seconds
- 📝 **Caption Processing**: ~2 seconds
- 🎬 **Video Rendering**: Real-time in browser

## 🛠️ Built With

- **Frontend**: Astro + React + TypeScript
- **Styling**: Tailwind CSS
- **AI Services**: 
  - Replicate API (FLUX image generation)
  - Fish Audio (Voice synthesis)
  - OpenAI GPT-4 (Script generation)
- **Hosting**: Cloudflare Pages
- **Video Processing**: Canvas API + MediaRecorder

## 🚀 Deployment

### Deploy to Cloudflare Pages:

1. Fork this repository
2. Connect to Cloudflare Pages
3. Set build settings:
   - **Framework**: Astro
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variables in Cloudflare dashboard
5. Deploy!

### Build locally:
```bash
npm run build
npm run preview
```

## 📊 Example Output

Your generated video will include:
- **Duration**: Exactly matches audio (30.537s)
- **Images**: 7 AI-generated visuals
- **Captions**: 33+ perfectly timed segments
- **Motion**: Unique animation per image
- **Quality**: Professional-grade output

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Replicate** for powerful AI image generation
- **Fish Audio** for natural voice synthesis
- **OpenAI** for script generation
- **Astro** for the amazing web framework
- **CapCut** for caption style inspiration

## 📞 Support

Found a bug or have a suggestion? [Open an issue](https://github.com/yourusername/viroshort-video-generator/issues)

---

<div align="center">
  <strong>🎬 Made with ❤️ for content creators</strong>
  <br>
  <em>Turn your ideas into viral videos in seconds!</em>
</div>
