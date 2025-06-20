import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log('🔍 FISH AUDIO DEBUG: Starting debug test...');
    
    // Get Fish Audio API key from Cloudflare environment variables
    const FISH_AUDIO_API_KEY = 
      (locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY ||
      import.meta.env.FISH_AUDIO_API_KEY ||
      process.env.FISH_AUDIO_API_KEY;

    console.log('🔍 FISH AUDIO DEBUG: Environment check:', {
      hasCloudflareEnv: !!((locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY),
      hasImportMetaKey: !!import.meta.env.FISH_AUDIO_API_KEY,
      hasProcessEnvKey: !!process.env.FISH_AUDIO_API_KEY,
      finalKeyFound: !!FISH_AUDIO_API_KEY,
      keyLength: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.length : 0,
      keyPrefix: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.substring(0, 8) + '...' : 'none'
    });

    if (!FISH_AUDIO_API_KEY || FISH_AUDIO_API_KEY === 'your_fish_audio_api_key_here') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Fish Audio API key not configured',
        debug: {
          hasCloudflareEnv: !!((locals as any)?.runtime?.env?.FISH_AUDIO_API_KEY),
          hasImportMetaEnv: !!import.meta.env.FISH_AUDIO_API_KEY,
          hasProcessEnv: !!process.env.FISH_AUDIO_API_KEY,
          environmentKeys: Object.keys((locals as any)?.runtime?.env || {})
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test 1: Check if API key works for voice listing
    console.log('🔍 TEST 1: Testing voice listing API...');
    const voicesResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 TEST 1 RESULT:', {
      status: voicesResponse.status,
      statusText: voicesResponse.statusText,
      ok: voicesResponse.ok
    });

    // Test 2: Try a simple TTS generation with a known voice
    console.log('🔍 TEST 2: Testing TTS generation...');
    const ttsResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: "Hello, this is a test.",
        reference_id: "593f6000dc4d4c93a8243468e4da8f73", // SpongeBob voice from the logs
        format: "mp3",
        latency: "normal",
        streaming: false
      })
    });

    console.log('🔍 TEST 2 RESULT:', {
      status: ttsResponse.status,
      statusText: ttsResponse.statusText,
      ok: ttsResponse.ok
    });

    let ttsError = null;
    if (!ttsResponse.ok) {
      try {
        ttsError = await ttsResponse.text();
        console.log('🔍 TEST 2 ERROR BODY:', ttsError);
      } catch (e) {
        console.log('🔍 TEST 2: Could not read error body');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      debug: {
        apiKeyFound: true,
        apiKeyLength: FISH_AUDIO_API_KEY.length,
        apiKeyPrefix: FISH_AUDIO_API_KEY.substring(0, 8) + '...',
        voicesTest: {
          status: voicesResponse.status,
          ok: voicesResponse.ok,
          statusText: voicesResponse.statusText
        },
        ttsTest: {
          status: ttsResponse.status,
          ok: ttsResponse.ok,
          statusText: ttsResponse.statusText,
          error: ttsError
        },
        environmentKeys: Object.keys((locals as any)?.runtime?.env || {}),
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('🔍 FISH AUDIO DEBUG ERROR:', error);
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