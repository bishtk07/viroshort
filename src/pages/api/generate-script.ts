import type { APIRoute } from 'astro';

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

// Template definitions for better script generation
const TEMPLATES: Record<string, string> = {
  'custom': 'Create a custom video script that is engaging and memorable. Focus on: ',
  'random': 'Generate a unique and creative story that surprises and entertains. Theme: ',
  'travel': 'Create an inspiring travel narrative that captures the essence of exploration. Focus on: ',
  'what-if': 'Explore a fascinating hypothetical scenario that makes people think. Consider: ',
  'scary': 'Create a spine-chilling story with psychological suspense. Setting: ',
  'bedtime': 'Craft a soothing and imaginative bedtime story that helps relaxation. Story about: ',
  'history': 'Share a fascinating historical tale that surprises and educates. Topic: ',
  'urban-legends': 'Tell an intriguing urban legend that captures imagination. Focus on: ',
  'motivational': 'Create an inspiring message that motivates and energizes. Theme: ',
  'fun-facts': 'Share mind-blowing facts that surprise and educate. Subject: ',
  'jokes': 'Craft a clever and entertaining long-form joke. Topic: ',
  'life-tips': 'Share a practical and valuable life hack. Area: '
};

export const POST: APIRoute = async ({ request }) => {
  console.log('=== GENERATE SCRIPT API CALLED ===');
  
  try {
    if (!OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI API key not configured',
        errorType: 'configuration_error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { prompt, duration, template } = await request.json();
    console.log('Request data:', { prompt, duration, template });

    if (!prompt || !duration) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: prompt and duration',
        errorType: 'validation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format prompt based on template
    const templateEnhancement = TEMPLATES[template as string] || '';
    const fullPrompt = `${templateEnhancement}${prompt}`;

    console.log('Full prompt being sent:', fullPrompt);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a creative scriptwriter for short-form video content. Create engaging, viral-worthy scripts that:
            - Are exactly ${duration} seconds long when spoken at normal pace
            - Hook viewers in the first 3 seconds
            - Have clear, conversational language
            - Include emotional moments or surprising elements
            - End with impact or call-to-action
            - Are suitable for visual storytelling
            
            Format: Return ONLY the script text, no additional formatting or explanations.`
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: Math.min(1000, duration * 15), // Roughly 15 tokens per second
        temperature: 0.8,
      }),
    });

    console.log('OpenAI Response Status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API Error:', errorText);
      
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      // Handle specific error types
      let errorType = 'api_error';
      let userMessage = 'Failed to generate script. Please try again.';

      if (openAIResponse.status === 429) {
        if (errorData.error?.code === 'insufficient_quota') {
          errorType = 'quota_exceeded';
          userMessage = 'OpenAI API quota exceeded. Please check your billing or enter a script manually.';
        } else {
          errorType = 'rate_limit';
          userMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        }
      } else if (openAIResponse.status === 401) {
        errorType = 'authentication';
        userMessage = 'API authentication failed. Please check your OpenAI API key.';
      } else if (openAIResponse.status === 400) {
        errorType = 'bad_request';
        userMessage = 'Invalid request. Please try with different parameters.';
      }

      return new Response(JSON.stringify({
        success: false,
        error: userMessage,
        errorType: errorType,
        details: errorData.error?.message || errorText
      }), {
        status: openAIResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await openAIResponse.json();
    console.log('OpenAI Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from OpenAI API',
        errorType: 'response_format'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const script = data.choices[0].message.content.trim();
    
    if (!script) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Empty script generated',
        errorType: 'empty_response'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Generated script:', script.substring(0, 100) + '...');

    return new Response(JSON.stringify({
      success: true,
      script: script,
      wordCount: script.split(/\s+/).length,
      estimatedDuration: duration
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    
    // Handle specific OpenAI errors
    if (error.response?.status === 429) {
      const errorData = error.response.data?.error;
      
      if (errorData?.type === 'insufficient_quota' || errorData?.code === 'insufficient_quota') {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'OpenAI quota exceeded. Please add credits to your account or use an alternative.',
          errorType: 'quota_exceeded',
          details: errorData?.message || 'Your OpenAI API quota has been exceeded.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (errorData?.type === 'rate_limit_exceeded') {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          errorType: 'rate_limit',
          details: errorData?.message || 'Too many requests. Please wait.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Handle invalid API key
    if (error.response?.status === 401) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid OpenAI API key. Please check your configuration.',
        errorType: 'invalid_key'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to generate script. Please try again.',
      errorType: 'generation_error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 