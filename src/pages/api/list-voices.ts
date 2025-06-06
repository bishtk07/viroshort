import type { APIRoute } from 'astro';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  category?: string;
  labels?: {
    accent?: string;
    gender?: string;
    [key: string]: string | undefined;
  };
  settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

interface CategorizedVoice extends ElevenLabsVoice {
  type: 'premium' | 'standard';
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Access environment variables from Cloudflare runtime
    const ELEVENLABS_API_KEY = (locals as any).runtime?.env?.ELEVEN_LABS_API_KEY || 
                              import.meta.env.ELEVEN_LABS_API_KEY || 
                              process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_api_key_here') {
      console.error('ElevenLabs API key not properly configured');
      console.log('Environment sources checked:', {
        cloudflareRuntime: !!(locals as any).runtime?.env?.ELEVEN_LABS_API_KEY,
        importMeta: !!import.meta.env.ELEVEN_LABS_API_KEY,
        processEnv: !!process.env.ELEVEN_LABS_API_KEY
      });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ElevenLabs API key not configured. Please add your API key to Cloudflare Pages environment variables.' 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('ElevenLabs API key found with length:', ELEVENLABS_API_KEY.length);

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to fetch voices from ElevenLabs: ${response.status} ${response.statusText}`,
          details: errorText
        }), 
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const data = await response.json();
    const voices = data.voices as ElevenLabsVoice[];

    if (!voices || !Array.isArray(voices)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid response format from ElevenLabs API' 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Categorize voices into premium and standard
    const categorizedVoices: CategorizedVoice[] = voices.map(voice => {
      const isPremium = voice.category === 'professional' || 
                       (voice.settings?.stability && voice.settings.stability > 0.5) ||
                       voice.name.toLowerCase().includes('premium');
      
      return {
        ...voice,
        type: isPremium ? 'premium' : 'standard'
      };
    });

    // Sort voices: premium first, then alphabetically by name
    categorizedVoices.sort((a, b) => {
      if (a.type === 'premium' && b.type === 'standard') return -1;
      if (a.type === 'standard' && b.type === 'premium') return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`Successfully fetched and categorized ${categorizedVoices.length} voices`);

    return new Response(
      JSON.stringify({
        success: true,
        voices: categorizedVoices
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in list-voices endpoint:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to fetch voices',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 