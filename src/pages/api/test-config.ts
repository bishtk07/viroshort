import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const config = {
      hasOpenAI: !!import.meta.env.OPENAI_API_KEY,
      hasElevenLabs: !!import.meta.env.ELEVEN_LABS_API_KEY,
      openAILength: import.meta.env.OPENAI_API_KEY ? import.meta.env.OPENAI_API_KEY.length : 0,
      elevenLabsLength: import.meta.env.ELEVEN_LABS_API_KEY ? import.meta.env.ELEVEN_LABS_API_KEY.length : 0,
    };

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