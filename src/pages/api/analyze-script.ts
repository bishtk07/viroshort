import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { scriptSegment } = await request.json();

    if (!scriptSegment) {
      return new Response(
        JSON.stringify({ error: 'Missing script segment' }),
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
            content: `You are a professional cinematographer and visual storytelling expert. Analyze the given script segment and provide detailed visual direction.

Your analysis should cover:
1. Emotional Atmosphere:
   - Core emotions in the scene
   - Mood and tone
   - Emotional progression

2. Visual Elements:
   - Key objects, characters, or symbols that must be in the scene
   - Important environmental details
   - Specific actions or movements to capture
   - Spatial relationships between elements

3. Composition Guidance:
   - Camera angle and perspective
   - Shot type (close-up, medium, wide, etc.)
   - Depth and layering suggestions
   - Focus points and visual hierarchy

4. Color and Lighting:
   - Primary and secondary color palette
   - Lighting style (natural, dramatic, soft, etc.)
   - Time of day or lighting conditions
   - Color symbolism and mood

5. Emphasis and Symbolism:
   - Key visual metaphors
   - Important details to highlight
   - Symbolic elements to include
   - Visual storytelling techniques

Format your response as a JSON object with these keys:
{
  "emotions": ["list", "of", "emotions"],
  "visualElements": ["detailed", "visual", "elements"],
  "composition": "comprehensive composition guidance",
  "colorPalette": ["specific", "colors", "with", "purpose"],
  "emphasis": "key visual emphasis and symbolism",
  "cameraDirection": "specific camera movement and framing guidance"
}`
          },
          {
            role: "user",
            content: scriptSegment
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content;
    
    if (!analysis) {
      throw new Error('Failed to analyze script segment');
    }

    return new Response(
      analysis,
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error analyzing script:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze script' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}; 