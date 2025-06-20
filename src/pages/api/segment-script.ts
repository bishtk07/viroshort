import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { script, audioDuration } = await request.json();

    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Script is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from Cloudflare environment variables
    const OPENAI_API_KEY = 
      (locals as any)?.runtime?.env?.OPENAI_API_KEY ||
      import.meta.env.OPENAI_API_KEY || 
      process.env.OPENAI_API_KEY;

    console.log('🧩 segment-script: Environment check:', {
      hasCloudflareEnv: !!((locals as any)?.runtime?.env?.OPENAI_API_KEY),
      hasImportMetaEnv: !!import.meta.env.OPENAI_API_KEY,
      hasProcessEnv: !!process.env.OPENAI_API_KEY,
      finalKeyFound: !!OPENAI_API_KEY
    });

    if (!OPENAI_API_KEY) {
      console.error('🚨 segment-script: OpenAI API key not found');
      // Fallback to simple sentence splitting
      const segments = script
        .split(/[.!?]+/)
        .filter((sentence: string) => sentence.trim().length > 10)
        .map((sentence: string) => sentence.trim());

      return new Response(
        JSON.stringify({ 
          segments,
          fallbackUsed: true,
          message: 'Used sentence splitting fallback due to missing OpenAI API key'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate target number of segments based on audio duration
    const targetSegments = Math.ceil((audioDuration || 30) / 3.5); // ~3.5 seconds per image
    
    console.log('🧩 Segmenting script:', {
      scriptLength: script.length,
      audioDuration: audioDuration || 30,
      targetSegments
    });

    // Call GPT API to segment script intelligently
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert video editor. Break the script into exactly ${targetSegments} meaningful segments for image generation. Each segment should:
            1. Be 1-3 sentences long
            2. Represent a distinct visual scene or concept
            3. Be suitable for creating a compelling image
            4. Flow naturally from one to the next
            
            Return ONLY the segments, one per line, without numbering or bullet points.`
          },
          {
            role: 'user',
            content: `Script: ${script}\n\nBreak this into ${targetSegments} visual segments:`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const segments: string[] = data.choices[0].message.content
      .split('\n')
      .filter((segment: string) => segment.trim().length > 0)
      .map((segment: string) => segment.trim());

    console.log('✅ Script segmented successfully:', {
      originalLength: script.length,
      segmentCount: segments.length,
      avgSegmentLength: Math.round(segments.reduce((acc, seg) => acc + seg.length, 0) / segments.length)
    });

    return new Response(
      JSON.stringify({ 
        segments,
        metadata: {
          originalScript: script.substring(0, 100) + '...',
          segmentCount: segments.length,
          targetSegments,
          audioDuration: audioDuration || 30
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('🚨 segment-script error:', error);
    
    // Always provide fallback segmentation
    try {
      const { script } = await request.json();
      const fallbackSegments = script
        .split(/[.!?]+/)
        .filter((sentence: string) => sentence.trim().length > 10)
        .map((sentence: string) => sentence.trim());

      return new Response(
        JSON.stringify({ 
          segments: fallbackSegments,
          fallbackUsed: true,
          error: 'AI segmentation failed, used sentence splitting',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (fallbackError) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to segment script',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}; 