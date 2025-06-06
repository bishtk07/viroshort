import type { APIRoute } from 'astro';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category?: string;
  labels?: {
    accent?: string;
    gender?: string;
    age?: string;
    [key: string]: string | undefined;
  };
}

interface ElevenLabsResponse {
  voices: ElevenLabsVoice[];
}

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 get-voices: Starting API call...');
    
    // Access environment variables with fallback - NO LOCALS DEPENDENCY
    const ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY || 
                               process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('🚨 get-voices: API key not found or invalid');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please add ELEVEN_LABS_API_KEY to your environment variables.',
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

    console.log('✅ get-voices: API key found, length:', ELEVEN_LABS_API_KEY.length);
    console.log('🌐 get-voices: Making request to ElevenLabs API...');

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      }
    });

    console.log('📡 get-voices: ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 get-voices: ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        keyLength: ELEVEN_LABS_API_KEY.length
      });
      
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
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
      console.error('🚨 get-voices: Invalid response format:', data);
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

    console.log(`✅ get-voices: Successfully fetched ${data.voices.length} voices`);

    // Add premium flag to voices with certain keywords in their names
    const processedVoices = data.voices.map(voice => ({
      ...voice,
      labels: {
        ...voice.labels,
        premium: voice.name.toLowerCase().includes('premium')
      }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        voices: processedVoices
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('🚨 get-voices: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error while fetching voices',
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
}; 