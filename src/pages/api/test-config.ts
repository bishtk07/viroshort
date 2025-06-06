import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check multiple environment sources
    const openaiKey = (locals as any).runtime?.env?.OPENAI_API_KEY || 
                     import.meta.env.OPENAI_API_KEY || 
                     process.env.OPENAI_API_KEY;
    
    const elevenLabsKey = (locals as any).runtime?.env?.ELEVEN_LABS_API_KEY || 
                         import.meta.env.ELEVEN_LABS_API_KEY || 
                         process.env.ELEVEN_LABS_API_KEY;
    
    const config = {
      hasOpenAI: !!openaiKey,
      hasElevenLabs: !!elevenLabsKey,
      openAILength: openaiKey ? openaiKey.length : 0,
      elevenLabsLength: elevenLabsKey ? elevenLabsKey.length : 0,
      // Debug info
      openAIPrefix: openaiKey ? openaiKey.substring(0, 8) + '...' : 'not found',
      elevenLabsPrefix: elevenLabsKey ? elevenLabsKey.substring(0, 8) + '...' : 'not found',
      environment: import.meta.env.MODE || 'unknown',
      platform: 'cloudflare-pages',
      // Environment source debugging
      sources: {
        cloudflareRuntime: {
          openai: !!(locals as any).runtime?.env?.OPENAI_API_KEY,
          elevenLabs: !!(locals as any).runtime?.env?.ELEVEN_LABS_API_KEY
        },
        importMeta: {
          openai: !!import.meta.env.OPENAI_API_KEY,
          elevenLabs: !!import.meta.env.ELEVEN_LABS_API_KEY
        },
        processEnv: {
          openai: !!process.env.OPENAI_API_KEY,
          elevenLabs: !!process.env.ELEVEN_LABS_API_KEY
        }
      }
    };

    console.log('Environment check:', {
      openAI: config.hasOpenAI,
      elevenLabs: config.hasElevenLabs,
      mode: config.environment,
      sources: config.sources
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