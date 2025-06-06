import type { APIRoute } from 'astro';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // Ensure we're using the main API endpoint
});

// Calculate target word count based on duration (2.5 words per second)
const WORDS_PER_SECOND = 2.5;

// Template-specific instructions
const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  'custom': 'Create a custom, engaging script that captures attention.',
  'random': 'Generate a unique and surprising story that entertains throughout.',
  'travel': 'Create a vivid travel narrative that transports viewers.',
  'what-if': 'Explore an intriguing hypothetical scenario with fascinating implications.',
  'scary': 'Build psychological tension and suspense, avoiding gore or explicit content.',
  'bedtime': 'Create a soothing and imaginative story perfect for relaxation.',
  'history': 'Share fascinating historical facts in an engaging narrative.',
  'urban-legends': 'Tell an intriguing urban legend that captivates viewers.',
  'motivational': 'Deliver an inspiring message that energizes and motivates.',
  'fun-facts': 'Share surprising and educational facts in an engaging way.',
  'jokes': 'Craft a clever long-form joke with a satisfying punchline.',
  'life-tips': 'Share practical advice that provides real value.'
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { prompt, duration, template } = body;

    if (!prompt || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400 }
      );
    }

    // Calculate target word count
    const targetWordCount = Math.floor(WORDS_PER_SECOND * duration);
    console.log(`Generating script for ${duration}s duration, target word count: ${targetWordCount}`);

    // Get template-specific instructions
    const templateInstruction = TEMPLATE_INSTRUCTIONS[template]
      ? `\nSpecific instructions for this template: ${TEMPLATE_INSTRUCTIONS[template]}`
      : '';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a creative script writer for short-form social media videos. Create engaging, concise scripts that capture attention quickly.

Key requirements:
- Aim for approximately ${targetWordCount} words (some variation is okay)
- Write ONLY the spoken narration - what will actually be said out loud
- NO scene descriptions, camera directions, or any text in parentheses/brackets
- NO emotion indicators like (excited) or (whispers)
- NO action descriptions
- The script should be roughly ${duration} seconds long when spoken at a natural pace
- Focus on creating viral, shareable content
- Use short, impactful sentences
- Create hooks that grab attention in the first 3 seconds${templateInstruction}

Example format:
"Did you know that honey never spoils? Ancient Egyptian tombs contained honey that was still perfectly good after thousands of years. That's because honey's unique chemical makeup makes it impossible for bacteria to grow. It's nature's only food that truly lasts forever."

NOT like this:
"[Camera pans over honey jar] (excited tone) Did you know that honey never spoils? (close up shot of honey) Ancient Egyptian tombs contained honey that was still perfectly good after thousands of years..."
`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const script = completion.choices[0]?.message?.content;
    
    if (!script) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate script' }),
        { status: 500 }
      );
    }

    // More lenient word count validation
    const wordCount = script.trim().split(/\s+/).length;
    const allowedVariance = Math.max(15, Math.floor(targetWordCount * 0.3));
    if (Math.abs(wordCount - targetWordCount) > allowedVariance) {
      console.log(`Generated script word count (${wordCount}) too far from target (${targetWordCount}), but proceeding anyway`);
    }

    return new Response(
      JSON.stringify({ script, success: true }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Error generating script:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate script', success: false }),
      { status: 500 }
    );
  }
}; 