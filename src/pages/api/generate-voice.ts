import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text, voiceId } = await request.json();

    if (!text || !voiceId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters (text and voiceId)' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Access environment variables with fallback
    const ELEVEN_LABS_API_KEY = import.meta.env.ELEVEN_LABS_API_KEY || 
                               process.env.ELEVEN_LABS_API_KEY;
    
    if (!ELEVEN_LABS_API_KEY || ELEVEN_LABS_API_KEY === 'your_api_key_here') {
      console.error('ElevenLabs API key not properly configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Voice generation service not configured. Please check environment variables.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Generating voice audio:', { 
      textLength: text.length,
      voiceId,
      apiKeyLength: ELEVEN_LABS_API_KEY.length
    });

    // Clean the script by removing narrator directions
    const cleanScript = text.replace(/\((.*?)\)/g, '') // Remove text in parentheses
                          .replace(/\[(.*?)\]/g, '')   // Remove text in square brackets
                          .replace(/\{(.*?)\}/g, '')   // Remove text in curly braces
                          .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
                          .replace(/["""]/g, '')       // Remove smart quotes
                          .trim();                     // Remove leading/trailing whitespace

    if (!cleanScript) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No valid text content found after cleaning' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call ElevenLabs API to generate audio
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('ElevenLabs API error response:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        console.error('Could not parse error response:', e);
        const errorText = await response.text();
        console.error('Raw error response:', errorText);
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Received empty audio data from ElevenLabs API' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Voice audio generated successfully:', { 
      audioSize: audioBuffer.byteLength,
      textLength: cleanScript.length 
    });

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
        duration: estimatedDuration,
        textLength: cleanScript.length,
        wordCount
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Voice generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Voice generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 