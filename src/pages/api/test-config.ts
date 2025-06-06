import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const openaiKey = import.meta.env.OPENAI_API_KEY;
    const elevenLabsKey = import.meta.env.ELEVEN_LABS_API_KEY;
    
    const config = {
      hasOpenAI: !!openaiKey,
      hasElevenLabs: !!elevenLabsKey,
      openAILength: openaiKey ? openaiKey.length : 0,
      elevenLabsLength: elevenLabsKey ? elevenLabsKey.length : 0,
      // Debug info
      openAIPrefix: openaiKey ? openaiKey.substring(0, 8) + '...' : 'not found',
      elevenLabsPrefix: elevenLabsKey ? elevenLabsKey.substring(0, 8) + '...' : 'not found',
      environment: import.meta.env.MODE || 'unknown',
      platform: 'cloudflare-pages'
    };

    console.log('Environment check:', {
      openAI: config.hasOpenAI,
      elevenLabs: config.hasElevenLabs,
      mode: config.environment
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        config
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in test-config:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Configuration test failed'
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