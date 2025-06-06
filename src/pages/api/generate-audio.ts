import type { APIRoute } from 'astro';

function cleanScript(script: string): string {
  return script
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
    .replace(/_(.*?)_/g, '$1')       // Remove _italic_
    .replace(/`(.*?)`/g, '$1')       // Remove `code`
    .replace(/#{1,6}\s*/g, '')       // Remove # headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace [text](link) with text
    .replace(/\n\s*\n/g, '\n')       // Replace multiple newlines with single
    .trim();
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('🔍 generate-audio: Starting API call...');
    
    const { script, voiceId } = await request.json();
    
    if (!script || !voiceId) {
      console.error('🚨 generate-audio: Missing required parameters:', { script: !!script, voiceId: !!voiceId });
      return new Response(
        JSON.stringify({ 
          error: 'Script and voice ID are required',
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

    console.log('🔍 generate-audio: Parameters received:', { 
      scriptLength: script.length, 
      voiceId,
      scriptPreview: script.substring(0, 100) + (script.length > 100 ? '...' : '')
    });
    
    // Try all possible sources for the API key with comprehensive logging
    const cloudflareKey = (locals as any).runtime?.env?.ELEVEN_LABS_API_KEY;
    const importMetaKey = import.meta.env.ELEVEN_LABS_API_KEY;
    const processEnvKey = process.env.ELEVEN_LABS_API_KEY;
    
    console.log('🔍 generate-audio: Environment sources check:', {
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
      console.error('🚨 generate-audio: API key not found or invalid');
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

    console.log('✅ generate-audio: API key found, length:', ELEVEN_LABS_API_KEY.length);

    // Clean and prepare the script
    const cleanedScript = cleanScript(script);
    console.log('🧹 generate-audio: Script cleaned, original:', script.length, 'cleaned:', cleanedScript.length);
    
    console.log('🌐 generate-audio: Making request to ElevenLabs API...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: cleanedScript,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    });

    console.log('📡 generate-audio: ElevenLabs API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 generate-audio: ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        voiceId,
        scriptLength: cleanedScript.length,
        keyLength: ELEVEN_LABS_API_KEY.length
      });
      
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
          details: errorText,
          success: false,
          debug: {
            voiceId,
            scriptLength: cleanedScript.length,
            apiKeyLength: ELEVEN_LABS_API_KEY.length,
            requestBody: {
              textLength: cleanedScript.length,
              model: "eleven_multilingual_v2"
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
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.error('🚨 generate-audio: Empty audio response');
      return new Response(
        JSON.stringify({ 
          error: 'Received empty audio data from ElevenLabs API',
          success: false,
          debug: {
            bufferSize: audioBuffer ? audioBuffer.byteLength : 0
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

    console.log('✅ generate-audio: Successfully generated audio, size:', audioBuffer.byteLength);

    // Return audio data as base64 for frontend consumption
    const audioArray = new Uint8Array(audioBuffer);
    const audioBase64 = Buffer.from(audioArray).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        metadata: {
          voiceId,
          scriptLength: cleanedScript.length,
          audioSize: audioBuffer.byteLength,
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('🚨 generate-audio: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error during audio generation',
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