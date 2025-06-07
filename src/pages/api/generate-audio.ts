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

function truncateScript(script: string, maxLength: number = 500): string {
  if (script.length <= maxLength) {
    return script;
  }
  
  // Try to truncate at sentence boundaries
  const sentences = script.split(/[.!?]+/);
  let truncated = '';
  let currentLength = 0;
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (trimmedSentence && currentLength + trimmedSentence.length + 1 <= maxLength) {
      truncated += (truncated ? '. ' : '') + trimmedSentence;
      currentLength = truncated.length;
    } else {
      break;
    }
  }
  
  // If we got a good truncation, return it
  if (truncated.length > maxLength * 0.5) {
    return truncated + '.';
  }
  
  // Otherwise, just truncate at word boundaries
  const words = script.split(' ');
  truncated = '';
  for (const word of words) {
    if ((truncated + ' ' + word).length <= maxLength) {
      truncated += (truncated ? ' ' : '') + word;
    } else {
      break;
    }
  }
  
  return truncated + '...';
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
    
    // Try to get API key from multiple sources - prioritize environment variables
    let ELEVEN_LABS_API_KEY;
    
    // For development, check process.env first (most reliable in Node.js)
    if (process.env.ELEVEN_LABS_API_KEY) {
      ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
      console.log('✅ generate-audio: Using API key from process.env');
    }
    // For production (Cloudflare Pages), check locals.runtime.env
    else if ((locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY) {
      ELEVEN_LABS_API_KEY = (locals as any).runtime.env.ELEVEN_LABS_API_KEY;
      console.log('✅ generate-audio: Using API key from Cloudflare runtime');
    }
    // Fallback to import.meta.env (Astro/Vite)
    else if (import.meta.env.ELEVEN_LABS_API_KEY) {
      ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY;
      console.log('✅ generate-audio: Using API key from import.meta.env');
    }
    
    console.log('🔍 generate-audio: API key status:', {
      hasProcessEnv: !!process.env.ELEVEN_LABS_API_KEY,
      hasCloudflareEnv: !!((locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY),
      hasImportMetaEnv: !!import.meta.env.ELEVEN_LABS_API_KEY,
      finalKeyExists: !!ELEVEN_LABS_API_KEY,
      keyLength: ELEVEN_LABS_API_KEY ? ELEVEN_LABS_API_KEY.length : 0,
      keyPrefix: ELEVEN_LABS_API_KEY ? ELEVEN_LABS_API_KEY.substring(0, 8) + '...' : 'none'
    });
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('🚨 generate-audio: API key not found or invalid');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please add ELEVEN_LABS_API_KEY to your environment variables.',
          success: false,
          debug: {
            hasProcessEnv: !!process.env.ELEVEN_LABS_API_KEY,
            hasCloudflareEnv: !!((locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY),
            hasImportMetaEnv: !!import.meta.env.ELEVEN_LABS_API_KEY,
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

    // Clean and prepare the script
    const cleanedScript = cleanScript(script);
    const finalScript = truncateScript(cleanedScript, 400); // Limit to 400 characters for reasonable credit usage
    
    console.log('🧹 generate-audio: Script processing:', {
      original: script.length,
      cleaned: cleanedScript.length,
      final: finalScript.length,
      truncated: finalScript.length < cleanedScript.length,
      preview: finalScript.substring(0, 100) + (finalScript.length > 100 ? '...' : '')
    });
    
    // Warn user if script was truncated
    const wasTruncated = finalScript.length < cleanedScript.length;
    
    console.log('🌐 generate-audio: Making request to ElevenLabs API...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      body: JSON.stringify({
        text: finalScript,
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
        scriptLength: finalScript.length,
        keyLength: ELEVEN_LABS_API_KEY.length,
        keyPrefix: ELEVEN_LABS_API_KEY.substring(0, 8) + '...'
      });
      
      // Handle specific error cases
      let userFriendlyError = `ElevenLabs API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        userFriendlyError = 'Invalid ElevenLabs API key. Please check your API key configuration.';
      } else if (response.status === 429) {
        userFriendlyError = 'ElevenLabs API rate limit exceeded. Please try again in a few minutes.';
      } else if (response.status === 422) {
        userFriendlyError = 'Invalid voice ID or script. Please check your input and try again.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: userFriendlyError,
          details: errorText,
          success: false,
          debug: {
            status: response.status,
            voiceId,
            scriptLength: finalScript.length,
            apiKeyLength: ELEVEN_LABS_API_KEY.length,
            apiKeyPrefix: ELEVEN_LABS_API_KEY.substring(0, 8) + '...'
          }
        }), 
        { 
          status: response.status >= 500 ? 500 : 400, // Map client errors to 400, server errors to 500
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
        wasTruncated,
        metadata: {
          voiceId,
          scriptLength: finalScript.length,
          originalLength: script.length,
          cleanedLength: cleanedScript.length,
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