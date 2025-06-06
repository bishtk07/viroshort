import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt, duration, template } = await request.json();

    if (!prompt && !template) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or template' }),
        { status: 400 }
      );
    }

    // Create topic based on prompt or template
    const topic = prompt || template;
    const targetDuration = duration || 60;

    // Check if API key is available
    const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OpenAI API key not configured. Please check environment variables.' 
        }),
        { status: 500 }
      );
    }

    console.log('OpenAI API key found with length:', OPENAI_API_KEY.length);

    // Use fetch instead of OpenAI SDK
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional scriptwriter specializing in creating engaging short-form video scripts for platforms like TikTok, Instagram Reels, and YouTube Shorts.

Create a compelling script that is:
- Engaging from the very first word with a strong hook
- Appropriate for ${targetDuration} seconds duration
- Written in a conversational, energetic style
- Structured with clear beginning, middle, and end
- Includes natural speech patterns and pauses
- Designed to keep viewers watching until the end
- Around ${Math.floor(targetDuration * 2.5)} words (average speaking pace)

IMPORTANT: Return ONLY the script text as a plain string, no JSON formatting, no additional structure. Just the raw script that can be read aloud.`
          },
          {
            role: "user",
            content: `Create a ${targetDuration}-second engaging video script about: ${topic}`
          }
        ],
        temperature: 0.8,
        max_tokens: Math.floor(targetDuration * 8) // Roughly 8 tokens per second
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const scriptContent = data.choices[0]?.message?.content;
    
    if (!scriptContent) {
      throw new Error('Failed to generate script content');
    }

    // Clean the script content
    const cleanScript = scriptContent.trim();

    return new Response(
      JSON.stringify({ 
        success: true,
        script: cleanScript,
        duration: targetDuration,
        template: template || 'custom',
        wordCount: cleanScript.split(/\s+/).length
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error generating script:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate script'
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