import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('🔍 preview-voice: Starting API call...');
    
    const { voiceId } = await request.json();
    
    if (!voiceId) {
      console.error('🚨 preview-voice: No voice ID provided');
      return new Response(
        JSON.stringify({ 
          error: 'Voice ID is required',
          success: false 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('🔍 preview-voice: Voice ID:', voiceId);
    
    // Try all possible sources for the API key with comprehensive logging
    const cloudflareKey = (locals as any).runtime?.env?.ELEVEN_LABS_API_KEY;
    const importMetaKey = import.meta.env.ELEVEN_LABS_API_KEY;
    const processEnvKey = process.env.ELEVEN_LABS_API_KEY;
    
    console.log('🔍 preview-voice: Environment sources check:', {
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
      console.error('🚨 preview-voice: API key not found or invalid');
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

    console.log('✅ preview-voice: API key found, length:', ELEVEN_LABS_API_KEY.length);

    // Sample text for voice preview
    const previewText = "Hello! This is a preview of my voice. I hope you find it suitable for your project.";
    
    console.log('🌐 preview-voice: Making request to ElevenLabs API for voice:', voiceId);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: previewText,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    console.log('📡 preview-voice: ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 preview-voice: ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        voiceId,
        keyLength: ELEVEN_LABS_API_KEY.length
      });
      
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
          details: errorText,
          success: false,
          debug: {
            voiceId,
            apiKeyLength: ELEVEN_LABS_API_KEY.length,
            requestBody: {
              text: previewText,
              model: "eleven_monolingual_v1"
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

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ preview-voice: Successfully generated audio, size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });

  } catch (error) {
    console.error('🚨 preview-voice: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error during voice preview',
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