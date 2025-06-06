import type { APIRoute } from 'astro';
import Replicate from 'replicate';
import OpenAI from 'openai';

interface RequestBody {
  script: string;
  style: string;
  audioDuration: number;
  aspectRatio: string;
}

// Initialize API clients
const replicate = new Replicate({
  auth: import.meta.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

// Art style prompts mapping
const ART_STYLE_PROMPTS: Record<string, string> = {
  'viroshorts': 'cinematic 8k ultra HD, professional cinematography, perfect lighting, high production value, movie quality, hyperrealistic, masterpiece, best quality, ultra detailed, realistic, photorealistic, high detail, intricate details, award winning cinematography, professional color grading',
  'lego': 'LEGO style, toy brick construction, plastic brick aesthetic, LEGO minifigure design, brick-built environment, 8k ultra HD, professional lighting',
  'comic-book': 'comic book art style, bold outlines, vibrant colors, comic panel layout, superhero comic aesthetic, dynamic composition, 8k ultra HD',
  'disney-toon': 'Disney animation style, classic Disney character design, magical Disney aesthetic, whimsical animation, Disney-Pixar quality, 8k ultra HD',
  'studio-chili': 'vibrant illustration style, unique artistic flair, modern design, professional illustration, contemporary art, 8k ultra HD',
  'childrens-book': 'children\'s book illustration style, warm colors, whimsical drawings, storybook art, gentle textures, 8k ultra HD',
  'photo-realism': 'photorealistic rendering, ultra-detailed photography, professional camera work, perfect lighting, high-end photography, 8k ultra HD, masterpiece quality',
  'minecraft': 'Minecraft game style, voxel art, blocky textures, Minecraft world aesthetic, pixelated 3D, 8k ultra HD',
  'watchmen': 'Watchmen comic style, gritty noir aesthetic, Dave Gibbons art style, dark comic book, dramatic shadows, 8k ultra HD',
  'watercolor': 'watercolor painting technique, soft color blending, artistic watercolor effects, traditional watercolor art, 8k ultra HD',
  'expressionism': 'expressionist art movement style, bold emotional strokes, distorted perspectives, intense colors, expressive painting, 8k ultra HD',
  'charcoal': 'charcoal drawing technique, dramatic black and white, textured charcoal strokes, artistic charcoal sketch, 8k ultra HD',
  'gtav': 'Grand Theft Auto V game style, modern 3D graphics, GTA aesthetic, video game rendering, urban environment, 8k ultra HD',
  'anime': 'Japanese anime style, manga art, anime character design, cel shaded, anime aesthetic, 8k ultra HD'
};

// Aspect ratio dimensions - increased for better quality
const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 832, height: 1472 },  // Vertical video
  '16:9': { width: 1472, height: 832 },  // Horizontal video
  '1:1': { width: 1024, height: 1024 }   // Square video
};

async function analyzeScriptSegment(segment: string) {
  try {
    const completion = await openai.chat.completions.create({
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
          content: segment
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const analysis = completion.choices[0]?.message?.content;
    if (!analysis) {
      throw new Error('Failed to get analysis from GPT-4');
    }

    console.log('[API generate-images] GPT-4 Analysis:', analysis);
    return JSON.parse(analysis);
  } catch (error) {
    console.error('Error analyzing script segment:', error);
    return null;
  }
}

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
