import type { APIRoute } from 'astro';

const PREVIEW_TEXT = "Hi there! This is how I sound. I hope you like my voice!";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { voiceId } = await request.json();

    if (!voiceId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Voice ID is required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call ElevenLabs API to generate preview
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.ELEVEN_LABS_API_KEY
        },
        body: JSON.stringify({
          text: PREVIEW_TEXT,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ElevenLabs API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorData.detail || 'Failed to generate preview'
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 for direct use
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Preview generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Failed to generate preview'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 