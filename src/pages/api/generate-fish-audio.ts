import type { APIRoute } from 'astro';

interface FishAudioTTSRequest {
  text: string;
  reference_id: string;
  format?: 'wav' | 'mp3' | 'opus';
  mp3_bitrate?: number;
  opus_bitrate?: number;
  latency?: 'normal' | 'balanced';
  streaming?: boolean;
}

interface FishAudioTTSResponse {
  audio: string; // Base64 encoded audio
  format: string;
}

// Utility function to truncate text at sentence boundaries - REMOVED
// function truncateAtSentence(text: string, maxLength: number = 400): { text: string; truncated: boolean; originalLength: number; finalLength: number } {
//   const originalLength = text.length;
  
//   if (originalLength <= maxLength) {
//     return {
//       text,
//       truncated: false,
//       originalLength,
//       finalLength: originalLength
//     };
//   }
  
//   // Find the last sentence ending within the limit
//   const truncatedText = text.substring(0, maxLength);
//   const lastSentenceEnd = Math.max(
//     truncatedText.lastIndexOf('.'),
//     truncatedText.lastIndexOf('!'),
//     truncatedText.lastIndexOf('?')
//   );
  
//   let finalText;
//   if (lastSentenceEnd > maxLength * 0.7) { // If we found a sentence end that's reasonably close to the limit
//     finalText = text.substring(0, lastSentenceEnd + 1);
//   } else {
//     // Fall back to word boundary
//     const lastSpace = truncatedText.lastIndexOf(' ');
//     finalText = lastSpace > 0 ? text.substring(0, lastSpace) : truncatedText;
//   }
  
//   return {
//     text: finalText,
//     truncated: true,
//     originalLength,
//     finalLength: finalText.length
//   };
// }

// More reliable default voice IDs from Fish Audio
// const DEFAULT_VOICE_IDS = [
//   '7eb30d8b5a4345e7b2a68b3e0f7c5d84',  // Well-tested voice 1
//   '8f2c1d9e4b6a5c7e3f0a8b9c2d5e6f01',  // Well-tested voice 2
//   '9a3e2f0b5c8d6e7f4a1b9c8d5e6f2a03'  // Well-tested voice 3
// ];

// Function to validate voice ID - simplified
function isValidVoiceId(voiceId: string): boolean {
  // Accept any voice ID that looks like a UUID (more lenient)
  // Fish Audio uses both UUID and custom formats
  if (!voiceId || voiceId.length < 10) return false;
  
  // Check for UUID format OR Fish Audio custom format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const fishAudioRegex = /^[0-9a-f]{32}$/i; // 32-character hex string
  
  return uuidRegex.test(voiceId) || fishAudioRegex.test(voiceId);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('🎤 generate-fish-audio: Starting Fish Audio TTS generation...');
    
    // Get Fish Audio API key from Cloudflare environment variables
    const FISH_AUDIO_API_KEY = 
      (locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY ||
      import.meta.env.FISH_AUDIO_API_KEY ||
      process.env.FISH_AUDIO_API_KEY;

    console.log('🎤 generate-fish-audio: Environment check:', {
      hasCloudflareEnv: !!((locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY),
      hasImportMetaKey: !!import.meta.env.FISH_AUDIO_API_KEY,
      hasProcessEnvKey: !!process.env.FISH_AUDIO_API_KEY,
      finalKeyFound: !!FISH_AUDIO_API_KEY,
      keyLength: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.length : 0
    });

    if (!FISH_AUDIO_API_KEY || FISH_AUDIO_API_KEY === 'your_fish_audio_api_key_here') {
      console.error('🚨 generate-fish-audio: Fish Audio API key not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Fish Audio API key not configured. Please add FISH_AUDIO_API_KEY to your environment variables.',
        debug: {
          hasCloudflareEnv: !!((locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY),
          hasImportMetaEnv: !!import.meta.env.FISH_AUDIO_API_KEY,
          hasProcessEnv: !!process.env.FISH_AUDIO_API_KEY
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get request body
    const body = await request.json();
    const { script, voiceId, format = 'mp3' } = body;
    
    console.log('🐟 generate-fish-audio: Request received:', {
      scriptLength: script?.length || 0,
      voiceId: voiceId || 'none',
      format
    });
    
    // Validate input
    if (!script || !voiceId) {
      console.error('🚨 generate-fish-audio: Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: script and voiceId are required',
          success: false
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Use the provided voice ID directly
    const validVoiceId = voiceId;
    
    console.log('🐟 generate-fish-audio: Using voice ID:', validVoiceId);
    
    // Use the full script without truncation
    const finalScript = script;
    
    console.log('🐟 generate-fish-audio: Script processing:', {
      scriptLength: finalScript.length,
      usingFullScript: true,
      voiceId: validVoiceId,
      format: format
    });
    
    console.log('✅ generate-fish-audio: API key found, generating audio...');

    // Try with the provided voice ID only (no fallback to fake IDs)
    console.log(`🔄 generate-fish-audio: Using voice: ${validVoiceId}`);
    
    // Prepare the TTS request
    const ttsRequest: FishAudioTTSRequest = {
      text: finalScript,
      reference_id: validVoiceId,
      format: format as 'wav' | 'mp3' | 'opus',
      latency: 'normal',
      streaming: false
    };

    try {
      // Make the Fish Audio TTS API call
      const response = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ttsRequest)
      });

      console.log(`🐟 generate-fish-audio: Fish Audio API response:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        voiceId: validVoiceId
      });

      if (response.ok) {
        // Success! Get the audio data
        const audioData = await response.arrayBuffer();
        const audioBase64 = Buffer.from(audioData).toString('base64');
        
        console.log('✅ generate-fish-audio: Audio generated successfully:', {
          audioSize: audioData.byteLength,
          base64Length: audioBase64.length,
          format: format,
          voiceUsed: validVoiceId
        });

        // Construct response
        const responseData = {
          success: true,
          audio_url: `data:audio/${format};base64,${audioBase64}`,
          audio_base64: audioBase64,
          format: format,
          original_voice_id: validVoiceId,
          used_voice_id: validVoiceId,
          script_info: {
            original_text: script,
            final_text: finalScript,
            was_truncated: false,
            original_length: finalScript.length,
            final_length: finalScript.length,
            truncation_message: null
          },
          voice_info: {
            voice_id: validVoiceId,
            provider: 'Fish Audio'
          }
        };

        return new Response(
          JSON.stringify(responseData),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        // Log the error details
        const errorText = await response.text();
        console.log(`🚨 generate-fish-audio: TTS generation failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          voiceId: validVoiceId
        });
        
        return new Response(
          JSON.stringify({ 
            error: `Fish Audio TTS failed: ${response.status} ${response.statusText}`,
            details: errorText,
            success: false,
            voiceId: validVoiceId,
            troubleshooting: "The voice ID might not support TTS generation, or there might be an issue with your Fish Audio account. Try selecting a different voice."
          }), 
          { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (fetchError) {
      console.error(`🚨 generate-fish-audio: Network error:`, fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Network error communicating with Fish Audio API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown network error',
          success: false
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('🚨 generate-fish-audio: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error while generating Fish Audio',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 