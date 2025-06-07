import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log('🔧 Testing configuration...');
    
    // Test ElevenLabs API key from multiple sources
    const processEnvKey = process.env.ELEVEN_LABS_API_KEY;
    const cloudflareKey = (locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY;
    const importMetaKey = import.meta.env.ELEVEN_LABS_API_KEY;
    
    // Determine which key to use (same logic as generate-audio)
    let ELEVEN_LABS_API_KEY;
    let keySource = 'none';
    
    if (processEnvKey) {
      ELEVEN_LABS_API_KEY = processEnvKey;
      keySource = 'process.env';
    } else if (cloudflareKey) {
      ELEVEN_LABS_API_KEY = cloudflareKey;
      keySource = 'cloudflare.runtime';
    } else if (importMetaKey) {
      ELEVEN_LABS_API_KEY = importMetaKey;
      keySource = 'import.meta.env';
    }
    
    // Test ElevenLabs API connection if key is available
    let elevenLabsStatus = 'not_tested';
    let elevenLabsError = null;
    
    if (ELEVEN_LABS_API_KEY && ELEVEN_LABS_API_KEY !== 'your_api_key_here') {
      try {
        console.log('🔧 Testing ElevenLabs API connection...');
        const testResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVEN_LABS_API_KEY
          }
        });
        
        if (testResponse.ok) {
          elevenLabsStatus = 'connected';
          console.log('✅ ElevenLabs API connection successful');
        } else {
          elevenLabsStatus = 'auth_failed';
          elevenLabsError = `HTTP ${testResponse.status}: ${testResponse.statusText}`;
          console.log('🚨 ElevenLabs API connection failed:', elevenLabsError);
        }
      } catch (error) {
        elevenLabsStatus = 'connection_failed';
        elevenLabsError = error instanceof Error ? error.message : 'Unknown error';
        console.log('🚨 ElevenLabs API test error:', elevenLabsError);
      }
    } else {
      elevenLabsStatus = 'no_key';
    }

    // Test OpenAI configuration
    const openaiKey = process.env.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    let openaiStatus = 'not_configured';
    
    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      openaiStatus = 'configured';
    }

    const config = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        astroEnv: import.meta.env.MODE
      },
      elevenLabs: {
        status: elevenLabsStatus,
        error: elevenLabsError,
        keySource: keySource,
        keyExists: !!ELEVEN_LABS_API_KEY,
        keyLength: ELEVEN_LABS_API_KEY ? ELEVEN_LABS_API_KEY.length : 0,
        keyPrefix: ELEVEN_LABS_API_KEY ? ELEVEN_LABS_API_KEY.substring(0, 8) + '...' : 'none',
        sources: {
          processEnv: !!processEnvKey,
          cloudflare: !!cloudflareKey,
          importMeta: !!importMetaKey
        }
      },
      openai: {
        status: openaiStatus,
        keyExists: !!openaiKey,
        keyLength: openaiKey ? openaiKey.length : 0
      },
      supabase: {
        url: import.meta.env.PUBLIC_SUPABASE_URL || 'not_configured',
        hasAnonKey: !!(import.meta.env.PUBLIC_SUPABASE_ANON_KEY)
      }
    };

    console.log('🔧 Configuration test complete:', config);

    return new Response(JSON.stringify(config, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('🚨 Configuration test error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, null, 2),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const POST: APIRoute = async () => {
  return handleRequest();
};

async function handleRequest() {
  try {
    // Access environment variables with fallback - NO LOCALS DEPENDENCY
    const openaiKey = import.meta.env.OPENAI_API_KEY || 
                     process.env.OPENAI_API_KEY;
    
    const elevenLabsKey = import.meta.env.ELEVEN_LABS_API_KEY || 
                         process.env.ELEVEN_LABS_API_KEY;

    console.log('Environment sources checked:', {
      openai: {
        importMeta: !!import.meta.env.OPENAI_API_KEY,
        processEnv: !!process.env.OPENAI_API_KEY,
        keyLength: openaiKey ? openaiKey.length : 0
      },
      elevenLabs: {
        importMeta: !!import.meta.env.ELEVEN_LABS_API_KEY,
        processEnv: !!process.env.ELEVEN_LABS_API_KEY,
        keyLength: elevenLabsKey ? elevenLabsKey.length : 0
      }
    });

    const result = {
      success: true,
      config: {
        hasOpenAI: !!(openaiKey && openaiKey !== 'your_api_key_here'),
        hasElevenLabs: !!(elevenLabsKey && elevenLabsKey !== 'your_api_key_here'),
        openAILength: openaiKey ? openaiKey.length : 0,
        elevenLabsLength: elevenLabsKey ? elevenLabsKey.length : 0
      },
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: typeof process !== 'undefined' ? 'node' : 'browser'
      }
    };

    console.log('Configuration check result:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error checking configuration:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to check configuration',
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
} 