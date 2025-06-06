import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompts } = await request.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid prompts array' }),
        { status: 400 }
      );
    }

    if (!import.meta.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500 }
      );
    }

    const imageGenerationPromises = prompts.map(async (prompt: string, index: number) => {
      try {
        // Use fetch instead of OpenAI SDK
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url"
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const imageUrl = data.data[0]?.url;

        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI');
        }

        return {
          index,
          url: imageUrl,
          prompt,
          success: true
        };
      } catch (error) {
        console.error(`Error generating image for prompt ${index}:`, error);
        return {
          index,
          url: null,
          prompt,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.all(imageGenerationPromises);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount
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
    console.error('Error in generate-images API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate images' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 
