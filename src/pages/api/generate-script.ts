import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { topic, style, duration } = await request.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Missing topic' }),
        { status: 400 }
      );
    }

    // Use fetch instead of OpenAI SDK
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional scriptwriter specializing in creating engaging video scripts. Create a compelling script based on the given parameters.

The script should be:
- Engaging and attention-grabbing from the first line
- Well-structured with clear narrative flow
- Appropriate for the specified duration (${duration} seconds)
- Written in ${style} style
- Include visual cues and direction for video production
- Have a strong hook, clear middle, and compelling conclusion

Format the response as a JSON object with:
{
  "title": "compelling video title",
  "script": "full script text with scene directions",
  "segments": [
    {
      "text": "segment text",
      "duration": seconds,
      "visualCues": "description of what should be shown"
    }
  ],
  "totalDuration": estimated_duration_in_seconds,
  "style": "${style}",
  "hooks": ["key engaging elements"]
}`
          },
          {
            role: "user",
            content: `Create a ${duration}-second video script about: ${topic}. Style: ${style}`
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const scriptContent = data.choices[0]?.message?.content;
    
    if (!scriptContent) {
      throw new Error('Failed to generate script');
    }

    return new Response(
      scriptContent,
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
      JSON.stringify({ error: 'Failed to generate script' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 