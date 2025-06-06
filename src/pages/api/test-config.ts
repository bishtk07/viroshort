import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return handleRequest();
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