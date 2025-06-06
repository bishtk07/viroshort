import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, script } = await request.json();

    // Call GPT API to segment script
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a video editor. Break scripts into meaningful narrative or emotional chunks. Each chunk should be 1-3 sentences long and represent a distinct idea or topic shift.'
          },
          {
            role: 'user',
            content: script
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const segments: string[] = data.choices[0].message.content
      .split('\n')
      .filter((segment: string) => segment.trim().length > 0);

    return new Response(
      JSON.stringify({ segments }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error segmenting script:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to segment script' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 