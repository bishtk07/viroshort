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
    const testVoiceId = '728f6ff2240d49308e8137ffe66008e2'; // ElevenLabs Adam from logs
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
      ok: ttsResponse.ok
    });

    let errorDetails = null;
    if (!ttsResponse.ok) {
      try {
        errorDetails = await ttsResponse.text();
        console.log('🔧 TTS Error details:', errorDetails);
      } catch (e) {
        console.log('🔧 Could not read error details');
      }
    } else {
      console.log('🔧 TTS SUCCESS!');
    }

    return new Response(JSON.stringify({
      success: ttsResponse.ok,
      testVoiceId: testVoiceId,
      response: {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        ok: ttsResponse.ok
      },
      errorDetails: errorDetails,
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