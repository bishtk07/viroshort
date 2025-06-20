import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  // Get ElevenLabs API key from Cloudflare environment variables
  const ELEVEN_LABS_API_KEY = 
    (locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY ||
    import.meta.env.ELEVEN_LABS_API_KEY ||
    process.env.ELEVEN_LABS_API_KEY;

  console.log('🎵 generate-voice: Environment check:', {
    hasCloudflareEnv: !!((locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY),
    hasImportMetaEnv: !!import.meta.env.ELEVEN_LABS_API_KEY,
    hasProcessEnv: !!process.env.ELEVEN_LABS_API_KEY,
    finalKeyFound: !!ELEVEN_LABS_API_KEY,
    keyLength: ELEVEN_LABS_API_KEY ? ELEVEN_LABS_API_KEY.length : 0
  });

  if (!ELEVEN_LABS_API_KEY) {
    console.error('🚨 generate-voice: ElevenLabs API key not found');
    return new Response(JSON.stringify({
      success: false,
      error: 'ElevenLabs API key not configured. Please add ELEVEN_LABS_API_KEY to your environment variables.',
      debug: {
        hasCloudflareEnv: !!((locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY),
        hasImportMetaEnv: !!import.meta.env.ELEVEN_LABS_API_KEY,
        hasProcessEnv: !!process.env.ELEVEN_LABS_API_KEY
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

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

    console.log('🎵 Generating voice audio:', { 
      textLength: text.length,
      voiceId,
      apiKeyLength: ELEVEN_LABS_API_KEY.length
    });

    // ✅ Clean the script by removing narrator directions
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

    console.log('🎵 Clean script to generate:', cleanScript.substring(0, 100) + '...');

    // ✅ Call ElevenLabs API to generate audio with timing data
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
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
          },
          output_format: 'mp3_44100_128'
        })
      }
    );

    console.log('🎵 ElevenLabs API Response Status:', response.status);

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('🚨 ElevenLabs API error response:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        console.error('🚨 Could not parse error response:', e);
        const errorText = await response.text();
        console.error('🚨 Raw error response:', errorText);
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

    // ✅ Get the response with audio and timing data
    const responseData = await response.json();
    
    if (!responseData.audio_base64) {
      console.error('🚨 Received empty audio data from ElevenLabs API');
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

    // ✅ Convert base64 audio to data URL
    const audioUrl = `data:audio/mpeg;base64,${responseData.audio_base64}`;

    // ✅ Process alignment data to create speech marks
    let speechMarks = [];
    if (responseData.alignment) {
      const { characters, character_start_times_seconds, character_end_times_seconds } = responseData.alignment;
      
      // Group characters into words with timing
      let currentWord = '';
      let wordStartTime = 0;
      
      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const startTime = character_start_times_seconds[i];
        const endTime = character_end_times_seconds[i];
        
        if (char === ' ' || i === characters.length - 1) {
          if (currentWord.trim()) {
            speechMarks.push({
              type: 'word',
              start: wordStartTime,
              end: endTime,
              value: currentWord.trim()
            });
          }
          currentWord = '';
          wordStartTime = character_start_times_seconds[i + 1] || endTime;
        } else {
          if (currentWord === '') {
            wordStartTime = startTime;
          }
          currentWord += char;
        }
      }
    }

    // ✅ Calculate actual duration from timing data
    let actualDuration;
    if (responseData.alignment && responseData.alignment.character_end_times_seconds.length > 0) {
      actualDuration = Math.max(...responseData.alignment.character_end_times_seconds);
    } else {
      // Fallback to estimation
      const wordCount = cleanScript.split(/\s+/).length;
      actualDuration = Math.ceil(wordCount * 0.4);
    }

    console.log('✅ Voice audio generated successfully:', { 
      audioSize: responseData.audio_base64.length,
      textLength: cleanScript.length,
      speechMarksCount: speechMarks.length,
      duration: actualDuration
    });

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl,
        speechMarks,
        duration: actualDuration,
        textLength: cleanScript.length,
        wordCount: cleanScript.split(/\s+/).length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('🚨 Voice generation error:', error);
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