import type { APIRoute } from 'astro';

interface ApiTestResult {
  success: boolean;
  models_available?: number;
  total_models?: number;
  error?: string;
}

interface FishAudioStatus {
  status: string;
  error: string | null;
  keyLength: number;
  api_test: ApiTestResult | null;
}

export const GET: APIRoute = async () => {
  try {
    console.log('🐟 test-fish-audio: Starting Fish Audio test...');
    
    // Get Fish Audio API key
    const FISH_AUDIO_API_KEY = 
      import.meta.env.FISH_AUDIO_API_KEY || 
      process.env.FISH_AUDIO_API_KEY;
    
    console.log('🐟 test-fish-audio: Environment check:', {
      hasImportMetaKey: !!import.meta.env.FISH_AUDIO_API_KEY,
      hasProcessEnvKey: !!process.env.FISH_AUDIO_API_KEY,
      finalKeyFound: !!FISH_AUDIO_API_KEY,
      keyLength: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.length : 0,
      keyPrefix: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.substring(0, 10) + '...' : 'none'
    });
    
    const keyConfigured = FISH_AUDIO_API_KEY && FISH_AUDIO_API_KEY !== 'your_fish_audio_api_key_here';
    
    let fishAudioStatus: FishAudioStatus = {
      status: keyConfigured ? 'key_configured' : 'key_not_configured',
      error: null,
      keyLength: FISH_AUDIO_API_KEY ? FISH_AUDIO_API_KEY.length : 0,
      api_test: null
    };

    // If key is configured, test the API connection
    if (keyConfigured) {
      try {
        console.log('🐟 test-fish-audio: Testing Fish Audio API connection...');
        
        // Test with a simple models list call
        const response = await fetch('https://api.fish.audio/model?page_size=1&page_number=1&visibility=public', {
          headers: {
            'Authorization': `Bearer ${FISH_AUDIO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('🐟 test-fish-audio: Fish Audio API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          const data = await response.json();
          fishAudioStatus.status = 'connected';
          fishAudioStatus.api_test = {
            success: true,
            models_available: data.items?.length || 0,
            total_models: data.total || 0
          };
          console.log('✅ test-fish-audio: Fish Audio API connection successful');
        } else {
          const errorText = await response.text();
          fishAudioStatus.status = 'api_error';
          fishAudioStatus.error = `HTTP ${response.status}: ${response.statusText}`;
          fishAudioStatus.api_test = {
            success: false,
            error: errorText
          };
          console.error('🚨 test-fish-audio: Fish Audio API error:', errorText);
        }
      } catch (apiError) {
        console.error('🚨 test-fish-audio: Fish Audio API connection failed:', apiError);
        fishAudioStatus.status = 'connection_failed';
        fishAudioStatus.error = apiError instanceof Error ? apiError.message : 'Unknown connection error';
        fishAudioStatus.api_test = {
          success: false,
          error: fishAudioStatus.error
        };
      }
    }

    const responseData = {
      timestamp: new Date().toISOString(),
      service: 'Fish Audio TTS Test',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        astroEnv: import.meta.env.MODE || 'unknown'
      },
      fishAudio: fishAudioStatus,
      instructions: keyConfigured ? 
        'Fish Audio API key is configured. Test results above.' : 
        'Please add your Fish Audio API key to the FISH_AUDIO_API_KEY environment variable. Get your key from: https://fish.audio/api'
    };

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 test-fish-audio: Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected server error during Fish Audio test',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, null, 2), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}; 