import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text, voiceId } = await request.json();

    if (!text || !voiceId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate API key
    const ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY;
    if (!ELEVEN_LABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Voice generation service not properly configured' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean the script by removing narrator directions
    const cleanScript = text.replace(/\((.*?)\)/g, '') // Remove text in parentheses
                          .replace(/\[(.*?)\]/g, '')   // Remove text in square brackets
                          .replace(/\{(.*?)\}/g, '')   // Remove text in curly braces
                          .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
                          .replace(/["""]/g, '')       // Remove smart quotes
                          .trim();                     // Remove leading/trailing whitespace

    console.log('Generating audio with:', { 
      scriptLength: cleanScript.length,
      voiceId,
      wordCount: cleanScript.split(/\s+/).length
    });

    // Call ElevenLabs API to generate audio
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY
        },
        body: JSON.stringify({
          text: cleanScript,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to generate audio';
      try {
        const errorData = await response.json();
        console.error('ElevenLabs API error:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        console.error('Error parsing API error response:', e);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Received empty audio data from API');
    }

    // Convert to base64 for direct use
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    // Estimate duration based on word count (average speaking rate)
    const wordCount = cleanScript.split(/\s+/).length;
    const estimatedDuration = Math.ceil(wordCount * 0.4); // Roughly 0.4 seconds per word

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        duration: estimatedDuration
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Audio generation error:', error);
    let errorMessage = 'Failed to generate audio';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 