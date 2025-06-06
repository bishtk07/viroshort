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
    // Check both API keys
    if (!import.meta.env.REPLICATE_API_TOKEN) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Replicate API token not configured' 
        }),
        { status: 500 }
      );
    }

    if (!import.meta.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI API token not configured' 
        }),
        { status: 500 }
      );
    }

    const body = await request.json() as RequestBody;
    const { script, style, audioDuration, aspectRatio } = body;

    // Validate required parameters
    if (!script || !style || !audioDuration || audioDuration <= 0 || !aspectRatio) {
      console.error('[API generate-images] Invalid parameters received:', body);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid required parameters (script, style, audioDuration, aspectRatio)' 
        }),
        { status: 400 }
      );
    }

    // Strict image count calculation (1 image every 3.5 seconds)
    const SECONDS_PER_IMAGE = 3.5;
    const targetImageCount = Math.max(1, Math.ceil(audioDuration / SECONDS_PER_IMAGE));

    console.log(`[API generate-images] Audio duration: ${audioDuration}s, Target image count: ${targetImageCount}`);

    // Validate style is supported
    if (!ART_STYLE_PROMPTS[style]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unsupported art style: ${style}`
        }),
        { status: 400 }
      );
    }

    const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9'];
    const stylePrompt = ART_STYLE_PROMPTS[style];

    const baseNegativePrompts = [
      "text, watermark, logo, signature",
      "blurry, distorted, low quality, ugly, duplicate",
      "morbid, mutilated, deformed, bad anatomy",
      "bad proportions, extra limbs, extra fingers, mutated hands",
      "poorly drawn face, poorly drawn hands",
      "missing limbs, floating limbs, disconnected limbs",
      "out of frame, cropped, worst quality",
      "low resolution, bad hands, text, error",
      "missing fingers, extra digit, fewer digits",
      "cropped, poorly drawn hands, poorly drawn face",
      "mutation, deformed, blurry, bad anatomy",
      "bad proportions, malformed limbs, extra limbs, cloned face",
      "out of frame, ugly, extra limbs, gross proportions",
      "malformed hands, long neck, blurred, bad art",
      "disfigured, oversaturated, grain",
      "missing arms, missing legs, extra arms, extra legs"
    ].join(", ");

    // Split script into meaningful chunks and ensure proper timing alignment
    const sentences = script
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Calculate timing for each sentence to align with audio
    const wordsPerSecond = 2.5; // Average speaking rate
    let currentTime = 0;
    const scriptChunks = sentences.map(sentence => {
      const wordCount = sentence.split(/\s+/).length;
      const duration = wordCount / wordsPerSecond;
      const chunk = {
        text: sentence,
        startTime: currentTime,
        duration: duration
      };
      currentTime += duration;
      return chunk;
    });

    // Generate prompts aligned with script timing and analyzed with GPT-4
    const promptsToGenerate = [];
    for (let i = 0; i < targetImageCount; i++) {
      const timePerImage = audioDuration / targetImageCount;
      const imageStartTime = i * timePerImage;
      const imageEndTime = imageStartTime + timePerImage;

      // Find all script chunks that overlap with this image's time window
      const relevantChunks = scriptChunks.filter(chunk =>
        (chunk.startTime >= imageStartTime && chunk.startTime < imageEndTime) ||
        (chunk.startTime + chunk.duration > imageStartTime && chunk.startTime < imageEndTime)
      );

      // Combine relevant script parts
      const scriptContent = relevantChunks.length > 0
        ? relevantChunks.map(chunk => chunk.text).join('. ')
        : sentences[Math.floor((i / targetImageCount) * sentences.length)];

      // Analyze script segment with GPT-4
      const analysis = await analyzeScriptSegment(scriptContent);
      console.log(`[API generate-images] Analysis for segment ${i + 1}:`, analysis);

      // Create enhanced prompt using the analysis
      let enhancedPrompt = `${stylePrompt}, `;
      
      if (analysis) {
        // Add emotional atmosphere
        if (analysis.emotions?.length > 0) {
          enhancedPrompt += `emotional atmosphere: ${analysis.emotions.join(', ')}, `;
        }

        // Add detailed visual elements with spatial relationships
        if (analysis.visualElements?.length > 0) {
          enhancedPrompt += `scene contains: ${analysis.visualElements.join(', ')}, `;
        }

        // Add composition and camera guidance
        if (analysis.composition) {
          enhancedPrompt += `composition: ${analysis.composition}, `;
        }

        // Add camera direction if available
        if (analysis.cameraDirection) {
          enhancedPrompt += `camera: ${analysis.cameraDirection}, `;
        }

        // Add lighting and color guidance
        if (analysis.colorPalette?.length > 0) {
          enhancedPrompt += `lighting and colors: ${analysis.colorPalette.join(', ')}, `;
        }

        // Add emphasis and symbolism
        if (analysis.emphasis) {
          enhancedPrompt += `emphasizing: ${analysis.emphasis}, `;
        }
      }

      // Add the script content and quality parameters
      enhancedPrompt += `scene showing: ${scriptContent}, 
        masterful cinematography, perfect composition, professional lighting,
        8k resolution, highly detailed, photorealistic, masterpiece quality,
        sharp focus, perfect framing, award-winning photography`;

      // Add style-specific quality parameters
      if (style === 'photo-realism') {
        enhancedPrompt += `, hyperrealistic, photographic, ultra detailed`;
      } else if (style === 'anime') {
        enhancedPrompt += `, anime style, high quality anime, studio ghibli, hayao miyazaki`;
      } else if (style === 'disney-toon') {
        enhancedPrompt += `, disney animation style, pixar quality, 3d animated`;
      }

      // Log the enhanced prompt for debugging
      console.log(`[API generate-images] Enhanced prompt for segment ${i + 1}:`, enhancedPrompt);

      promptsToGenerate.push(enhancedPrompt);
    }

    console.log(`[API generate-images] Generating ${promptsToGenerate.length} enhanced prompts for ${targetImageCount} images.`);
    console.log('[API generate-images] Prompt timing alignment:', promptsToGenerate.map((_, i) => ({
      imageIndex: i,
      timeWindow: `${(i * audioDuration / targetImageCount).toFixed(1)}s - ${((i + 1) * audioDuration / targetImageCount).toFixed(1)}s`
    })));

    // Generate images with strict count control
    const imagePromises = promptsToGenerate.map(async (prompt, index) => {
      console.log(`[API generate-images] Starting generation for image ${index + 1}/${targetImageCount}`);
      await new Promise(resolve => setTimeout(resolve, index * 1500));

      try {
        console.log(`[API generate-images] Calling Replicate API for image ${index + 1}:`, {
          width: dimensions.width,
          height: dimensions.height,
          prompt: prompt.substring(0, 100) + '...' // Log first 100 chars of prompt
        });

        const imageResponse = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          {
            input: {
              prompt: `${prompt}, ${stylePrompt}, 8k ultra HD, cinematic lighting, professional photography, masterpiece, best quality, intricate details`,
              negative_prompt: baseNegativePrompts,
              width: dimensions.width,
              height: dimensions.height,
              num_outputs: 1,
              scheduler: "K_EULER_ANCESTRAL",
              num_inference_steps: 50,
              guidance_scale: 7.5,
              refine: "expert_ensemble_refiner",
              high_noise_frac: 0.8,
              prompt_strength: 0.8,
            }
          }
        );

        console.log(`[API generate-images] Replicate API response for image ${index + 1}:`, imageResponse);

        if (!Array.isArray(imageResponse) || imageResponse.length === 0 || !imageResponse[0]) {
          console.warn(`[API generate-images] Empty output for prompt ${index + 1}/${targetImageCount}`);
          return null;
        }

        console.log(`[API generate-images] Successfully generated image ${index + 1}:`, imageResponse[0]);
        return imageResponse[0];
      } catch (error) {
        console.error(`[API generate-images] Error generating image ${index + 1}/${targetImageCount}:`, error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error(`Error details: ${error.message}`);
          console.error(`Error stack: ${error.stack}`);
        }
        return null;
      }
    });

    console.log('[API generate-images] Waiting for all image generation promises to resolve...');

    // Wait for all images and filter out failures
    const results = await Promise.all(imagePromises);
    const validImages = results.filter((url): url is string => url !== null);

    // If we didn't get any valid images, return error
    if (validImages.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to generate any valid images'
        }),
        { status: 500 }
      );
    }

    // If we got fewer images than expected, log warning but continue
    if (validImages.length < targetImageCount) {
      console.warn(`[API generate-images] Warning: Generated ${validImages.length} images instead of ${targetImageCount}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        images: validImages
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[API generate-images] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      { status: 500 }
    );
  }
}; 
