# 🎬 ViroShort - AI Video Generator

An advanced AI-powered video generation platform that creates viral-style short videos with synchronized captions, motion effects, and precise audio timing.

![ViroShort Demo](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=ViroShort+AI+Video+Generator)

## 🚀 Features

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

### 🛠️ **Debug & Development Tools**
- **Frame-by-frame logging**: First 5 seconds detailed timing
- **Image usage statistics**: Track which images are used when
- **Visual debug overlay**: Real-time segment and timing information
- **Console diagnostics**: Comprehensive logging system

## 📋 Requirements

- Node.js 18+ 
- Modern web browser with Canvas API support
- OpenAI API key (for script generation)
- ElevenLabs API key (for text-to-speech)

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/viroshort.git
cd viroshort
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:4321`

## 🎮 Usage

1. **Enter your topic**: Type what you want the video to be about
2. **Upload images**: Add 3-5 high-quality images related to your topic
3. **Choose settings**:
   - Aspect ratio (9:16 for TikTok, 16:9 for YouTube, 1:1 for Instagram)
   - Caption style (multiple professional styles available)
4. **Generate video**: Click "Generate Video" and wait for processing
5. **Download**: Save your generated video

## 🔍 Debug Mode

For development and troubleshooting, you can enable debug mode:

```javascript
// In src/pages/video-generation.astro
const DEBUG_MODE = true; // Set to false for production
```

**Debug mode provides**:
- Visual overlay with timing information
- Frame-by-frame console logs
- Image usage statistics
- Segment synchronization details
- Caption timing verification

## 📊 Performance Metrics

- **Rendering Speed**: ~30 FPS real-time generation
- **Audio Sync Accuracy**: ±50ms precision
- **Memory Usage**: Optimized for large image sets
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge

## 🐛 Troubleshooting

### Common Issues

**Images not switching correctly**
- Check console for segment timing logs
- Verify image upload completed successfully
- Enable debug mode to see current image index

**Audio-video desync**
- Ensure audio file loads completely before generation
- Check browser console for timing warnings
- Verify FPS setting matches your system capabilities

**Caption timing issues**
- Review caption generation logs
- Check audio duration calculation
- Verify word count and timing calculations

### Debug Console Output

When debug mode is enabled, you'll see:
```
🎯 IMPROVED TIMING: { totalWords: 45, audioDuration: "20.50s", wordsPerSecond: 2.2 }
🎬 Frame 0: 0.000s
🔄 TIMESTAMP 0.000s: Segment 1/4, Image 1/3 (Hello everyone, welcome...)
📝 Caption: "Hello everyone" (0.00s - 1.82s)
📊 FINAL IMAGE USAGE STATISTICS:
  Image 1: 150 frames (24.4%)
  Image 2: 225 frames (36.6%)
  Image 3: 240 frames (39.0%)
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Self-hosted
```bash
npm run build
# Serve dist/ folder with any static hosting
```

## 🛡️ API Rate Limits

- **OpenAI**: Monitor usage in your dashboard
- **ElevenLabs**: Check character limits for your plan
- **Consider implementing**: Request caching and user limits

## 📝 File Structure

```
viroshort/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── generate-script.ts    # OpenAI script generation
│   │   │   ├── generate-audio.ts     # ElevenLabs TTS
│   │   │   ├── generate-video.ts     # Video segment creation
│   │   │   └── generate-captions.ts  # Caption synchronization
│   │   ├── video-generation.astro    # Main video rendering
│   │   └── index.astro              # Landing page
│   └── components/                   # Reusable components
├── public/                          # Static assets
└── package.json
```

## 🔧 Configuration

### Motion Effects
Edit `renderImageWithControlledMotion()` in `video-generation.astro`:
```javascript
const motionEffects = {
  'zoom-in': { scale: 1.0 + progress * 0.3 },
  'zoom-out': { scale: 1.3 - progress * 0.3 },
  'pan-right': { translateX: -50 + progress * 100 },
  'rotate': { rotation: progress * 10 }
};
```

### Caption Styles
Modify `getCapCutStyleTemplate()` in `generate-captions.ts` to add new styles.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper debugging
4. Test thoroughly with debug mode enabled
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🆘 Support

- **Issues**: Create a GitHub issue with debug console output
- **Features**: Submit feature requests with use cases
- **Documentation**: Contribute to improve this README

---

**⚡ Latest Updates**
- ✅ Fixed audio-video synchronization using Aegisub principles
- ✅ Enhanced caption timing with realistic speech patterns  
- ✅ Added comprehensive debugging system
- ✅ Improved image switching accuracy
- ✅ Added visual debug overlays for development

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
