import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log('🔧 SIMPLE FISH TEST: Starting...');
    
    // Get Fish Audio API key from Cloudflare environment variables
    const FISH_AUDIO_API_KEY = 
      (locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY ||
      import.meta.env.FISH_AUDIO_API_KEY ||
      process.env.FISH_AUDIO_API_KEY;

    console.log('🔧 API Key check:', {
      found: !!FISH_AUDIO_API_KEY,
      length: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.length : 0,
      prefix: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.substring(0, 8) + '...' : 'none'
    });

    if (!FISH_AUDIO_API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fish Audio API key not found'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test with one of the voice IDs from your console logs
    const testVoiceId = '802e3bc2b27e49c2995d23ef70e6ac89'; // Energetic Male from your logs
    console.log('🔧 Testing voice ID:', testVoiceId);

    // Try Fish Audio TTS generation
    const ttsResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Hello, this is a simple test.",
        reference_id: testVoiceId,
        format: "mp3",
        latency: "normal",
        streaming: false
      })
    });

    console.log('🔧 TTS Response:', {
      status: ttsResponse.status,
      statusText: ttsResponse.statusText,
      ok: ttsResponse.ok,
      headers: Object.fromEntries(ttsResponse.headers.entries())
    });

    let responseContent = null;
    let isAudioResponse = false;
    
    try {
      const contentType = ttsResponse.headers.get('content-type') || '';
      
      if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
        // This is audio data
        isAudioResponse = true;
        const audioData = await ttsResponse.arrayBuffer();
        responseContent = {
          type: 'audio',
          contentType: contentType,
          size: audioData.byteLength,
          message: 'Audio generated successfully!'
        };
      } else {
        // This is probably JSON or text error message
        responseContent = await ttsResponse.text();
        try {
          responseContent = JSON.parse(responseContent);
        } catch (e) {
          // Keep as text if not JSON
        }
      }
    } catch (e) {
      console.log('🔧 Error reading response:', e);
      responseContent = { error: 'Could not read response', details: e };
    }

    return new Response(JSON.stringify({
      success: ttsResponse.ok && isAudioResponse,
      testVoiceId: testVoiceId,
      apiResponse: {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        ok: ttsResponse.ok,
        contentType: ttsResponse.headers.get('content-type'),
        isAudioResponse: isAudioResponse
      },
      responseContent: responseContent,
      diagnosis: ttsResponse.ok 
        ? (isAudioResponse ? 'SUCCESS: Audio generated!' : 'API returned 200 but no audio - check response content')
        : 'API returned error - check response content',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('🔧 SIMPLE FISH TEST ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 