# Viroshort - AI-Powered Video Generation

Viroshort is an AI-powered video generation platform that creates engaging short-form videos by combining script generation, voice synthesis, and AI image generation.

## Features

- 🤖 AI Script Generation using GPT-4
- 🎙️ Voice Synthesis with ElevenLabs
- 🎨 AI Image Generation with Replicate
- 🎬 Automatic Video Creation
- 🎯 Multiple Video Styles
- 📱 Responsive Design

## Tech Stack

- **Framework**: [Astro](https://astro.build)
- **UI**: [React](https://reactjs.org), [TailwindCSS](https://tailwindcss.com)
- **AI Services**: 
  - OpenAI GPT-4 (Script Analysis)
  - Replicate (Image Generation)
  - ElevenLabs (Voice Synthesis)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Database**: [Supabase](https://supabase.com)

## Getting Started

### Prerequisites

- Node.js 18.x
- npm or yarn
- API keys for:
  - OpenAI
  - Replicate
  - ElevenLabs
  - Supabase

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/viroshort.git
cd viroshort
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
ELEVEN_LABS_API_KEY=your_elevenlabs_api_key
```

4. Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Deployment

This project is configured for deployment on Cloudflare Pages. See the [Cloudflare Deployment Guide](./cloudflare-deployment-guide.md) for detailed instructions.

### Quick Deploy Steps:

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Configure environment variables in Cloudflare dashboard
4. Deploy automatically on every push!

## Environment Variables

Required environment variables:

- `PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key
- `REPLICATE_API_TOKEN`: Your Replicate API token
- `ELEVEN_LABS_API_KEY`: Your ElevenLabs API key

## Architecture

- **Frontend**: Astro.js with React components deployed on Cloudflare Pages
- **Backend**: Supabase for database and authentication
- **AI Services**: OpenAI, Replicate, and ElevenLabs APIs
- **Edge Computing**: API routes run on Cloudflare's global network

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
