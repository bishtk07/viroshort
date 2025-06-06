import type { APIRoute } from 'astro';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url: string;
  labels?: {
    accent?: string;
    gender?: string;
    [key: string]: string | undefined;
  };
}

interface ElevenLabsResponse {
  voices: ElevenLabsVoice[];
}

export const GET: APIRoute = async () => {
  try {
    // Access environment variables with fallback - CONSISTENT NAMING
    const ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY || 
                               process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('ElevenLabs API key not properly configured');
      console.log('Environment check:', {
        importMeta: !!import.meta.env.ELEVEN_LABS_API_KEY,
        processEnv: !!process.env.ELEVEN_LABS_API_KEY,
        nodeEnv: process.env.NODE_ENV
      });
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please add ELEVEN_LABS_API_KEY to environment variables.',
          success: false
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('ElevenLabs API key found with length:', ELEVEN_LABS_API_KEY.length);
    console.log('Fetching voices from ElevenLabs...'); // Debug log

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch voices from ElevenLabs: ${response.status} ${response.statusText}`,
          details: errorText,
          success: false
        }), 
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const data = await response.json() as ElevenLabsResponse;
    
    if (!data.voices || !Array.isArray(data.voices)) {
      console.error('Invalid response format from ElevenLabs:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from ElevenLabs API',
          success: false
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`Successfully fetched ${data.voices.length} voices`); // Debug log

    return new Response(
      JSON.stringify({
        success: true,
        voices: data.voices.map((voice: ElevenLabsVoice) => ({
          voice_id: voice.voice_id,
          name: voice.name,
          preview_url: voice.preview_url,
          labels: voice.labels || {}
        }))
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in get-voices endpoint:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch voices',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 