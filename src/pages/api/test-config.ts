import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Access environment variables from multiple sources with fallback
    const openaiKey = (locals as any)?.runtime?.env?.OPENAI_API_KEY || 
                     import.meta.env.OPENAI_API_KEY || 
                     process.env.OPENAI_API_KEY;
    
    const elevenLabsKey = (locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY || 
                         import.meta.env.ELEVEN_LABS_API_KEY || 
                         process.env.ELEVEN_LABS_API_KEY;

    console.log('Environment sources checked:', {
      openai: {
        cloudflareRuntime: !!(locals as any)?.runtime?.env?.OPENAI_API_KEY,
        importMeta: !!import.meta.env.OPENAI_API_KEY,
        processEnv: !!process.env.OPENAI_API_KEY
      },
      elevenLabs: {
        cloudflareRuntime: !!(locals as any)?.runtime?.env?.ELEVEN_LABS_API_KEY,
        importMeta: !!import.meta.env.ELEVEN_LABS_API_KEY,
        processEnv: !!process.env.ELEVEN_LABS_API_KEY
      }
    });

    const result = {
      openaiConfigured: !!(openaiKey && openaiKey !== 'your_api_key_here'),
      elevenLabsConfigured: !!(elevenLabsKey && elevenLabsKey !== 'your_api_key_here'),
      openaiLength: openaiKey ? openaiKey.length : 0,
      elevenLabsLength: elevenLabsKey ? elevenLabsKey.length : 0,
      timestamp: new Date().toISOString(),
      runtime: {
        hasLocals: !!locals,
        hasCloudflareRuntime: !!(locals as any)?.runtime?.env
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
}; 