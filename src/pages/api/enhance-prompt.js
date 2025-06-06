export async function POST({ request }) {
  try {
    const { prompt } = await request.json();

    // Use OpenAI API directly with fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a creative assistant that enhances video prompts. Take the user\'s basic prompt and make it more detailed, cinematic, and visually appealing for AI video generation. Keep it under 200 characters.'
          },
          {
            role: 'user',
            content: `Enhance this video prompt: "${prompt}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content || prompt;
    
    return new Response(JSON.stringify({ 
      originalPrompt: prompt,
      enhancedPrompt: enhancedPrompt.trim() 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to enhance prompt',
      originalPrompt: prompt,
      enhancedPrompt: prompt 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 