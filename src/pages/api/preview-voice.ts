import type { APIRoute } from 'astro';

// Preview text to use for all voice previews
const PREVIEW_TEXT = "Hello, this is a preview of this voice. This gives you an idea of how it sounds.";

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const { voiceId } = await request.json();
    
    if (!voiceId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Voice ID is required' 
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Access environment variables with fallback
    const ELEVENLABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY || 
                              process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_api_key_here') {
      console.error('ElevenLabs API key not properly configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'ElevenLabs API key not configured. Please add your API key to environment variables.' 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log('Generating voice preview for voice ID:', voiceId);
    console.log('ElevenLabs API key found with length:', ELEVENLABS_API_KEY.length);

    // Generate voice preview using ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: PREVIEW_TEXT,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to generate voice preview: ${response.status} ${response.statusText}`,
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

    // Convert audio response to base64 for direct use
    const audioBuffer = await response.arrayBuffer();
    const audioArray = new Uint8Array(audioBuffer);
    const audioBase64 = Buffer.from(audioArray).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    console.log('Voice preview generated successfully');

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
    console.error('Error in preview-voice endpoint:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate voice preview',
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