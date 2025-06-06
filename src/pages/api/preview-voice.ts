import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
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
    
    // Access environment variables with fallback - NO LOCALS DEPENDENCY
    const ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY || 
                               process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('🚨 preview-voice: API key not found or invalid');
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

    const audioBuffer = await response.arrayBuffer();
    console.log('✅ preview-voice: Successfully generated audio, size:', audioBuffer.byteLength);

    // Convert audio buffer to base64 data URL
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('🚨 preview-voice: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error during voice preview',
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