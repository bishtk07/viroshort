import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    console.log('🔍 test-config: Starting configuration test...');
    
    // Test all possible environment variable sources
    const importMetaKey = import.meta.env.ELEVEN_LABS_API_KEY;
    const processEnvKey = process.env.ELEVEN_LABS_API_KEY;
    
    console.log('🔍 Environment check:', {
      importMeta: {
        available: !!importMetaKey,
        value: importMetaKey ? `${importMetaKey.substring(0, 8)}...` : 'not found',
        length: importMetaKey ? importMetaKey.length : 0
      },
      processEnv: {
        available: !!processEnvKey,
        value: processEnvKey ? `${processEnvKey.substring(0, 8)}...` : 'not found',
        length: processEnvKey ? processEnvKey.length : 0
      },
      nodeEnv: process.env.NODE_ENV,
      allImportMetaEnv: Object.keys(import.meta.env).filter(k => k.includes('ELEVEN')),
      allProcessEnv: Object.keys(process.env).filter(k => k.includes('ELEVEN'))
    });

    return new Response(
      JSON.stringify({
        success: true,
        config: {
          hasImportMetaKey: !!importMetaKey,
          hasProcessEnvKey: !!processEnvKey,
          importMetaKeyLength: importMetaKey ? importMetaKey.length : 0,
          processEnvKeyLength: processEnvKey ? processEnvKey.length : 0,
          nodeEnv: process.env.NODE_ENV,
          elevenlabsKeys: {
            importMeta: Object.keys(import.meta.env).filter(k => k.includes('ELEVEN')),
            processEnv: Object.keys(process.env).filter(k => k.includes('ELEVEN'))
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('🚨 test-config: Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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