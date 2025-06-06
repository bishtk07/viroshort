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

export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log('🔍 get-voices: Starting API call...');
    
    // Try all possible sources for the API key with comprehensive logging
    const cloudflareKey = (locals as any).runtime?.env?.ELEVEN_LABS_API_KEY;
    const importMetaKey = import.meta.env.ELEVEN_LABS_API_KEY;
    const processEnvKey = process.env.ELEVEN_LABS_API_KEY;
    
    console.log('🔍 get-voices: Environment sources check:', {
      cloudflareRuntime: !!cloudflareKey,
      cloudflareLength: cloudflareKey ? cloudflareKey.length : 0,
      importMeta: !!importMetaKey,
      importMetaLength: importMetaKey ? importMetaKey.length : 0,
      processEnv: !!processEnvKey,
      processEnvLength: processEnvKey ? processEnvKey.length : 0,
      nodeEnv: process.env.NODE_ENV
    });
    
    // Use the first available key
    const ELEVEN_LABS_API_KEY = cloudflareKey || importMetaKey || processEnvKey;
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('🚨 get-voices: API key not found or invalid');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please add ELEVEN_LABS_API_KEY to your Cloudflare Pages environment variables.',
          success: false,
          debug: {
            cloudflareAvailable: !!cloudflareKey,
            importMetaAvailable: !!importMetaKey,
            processEnvAvailable: !!processEnvKey,
            nodeEnv: process.env.NODE_ENV
          }
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
          success: false,
          debug: {
            apiKeyLength: ELEVEN_LABS_API_KEY.length,
            requestHeaders: {
              accept: 'application/json',
              apiKeyPresent: true
            }
          }
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
          success: false,
          debug: {
            responseReceived: !!data,
            voicesArray: Array.isArray(data?.voices),
            dataKeys: data ? Object.keys(data) : []
          }
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

    // Transform and enrich voice data
    const transformedVoices = data.voices.map((voice: ElevenLabsVoice) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url,
      labels: {
        gender: voice.labels?.gender || 'Neutral',
        accent: voice.labels?.accent || 'Universal',
        age: voice.labels?.age || 'Adult',
        premium: voice.labels?.premium || false,
        ...voice.labels
      }
    }));

    return new Response(
      JSON.stringify({
        success: true,
        voices: transformedVoices,
        count: transformedVoices.length,
        timestamp: new Date().toISOString()
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
        error: 'Unexpected server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined
        }
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