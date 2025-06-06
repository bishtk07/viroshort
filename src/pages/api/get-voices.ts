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
    const ELEVENLABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_api_key_here') {
      console.error('ElevenLabs API key not properly configured');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please add your API key to the .env file.' 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Fetching voices from ElevenLabs...'); // Debug log

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

    const data = await response.json() as ElevenLabsResponse;
    
    if (!data.voices || !Array.isArray(data.voices)) {
      console.error('Invalid response format from ElevenLabs:', data);
      return new Response(
        JSON.stringify({ 
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

    console.log(`Successfully fetched ${data.voices.length} voices`); // Debug log

    return new Response(
      JSON.stringify({
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
} 