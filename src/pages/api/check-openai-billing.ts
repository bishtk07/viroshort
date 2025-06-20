import type { APIRoute } from 'astro';

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test the API key with a minimal request
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.status === 401) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid API key',
        suggestion: 'Please check your OpenAI API key configuration'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (testResponse.status === 429) {
      const errorText = await testResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      if (errorData.error?.code === 'insufficient_quota') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient quota',
          details: 'Your OpenAI account has exceeded its quota. Please add credits.',
          suggestion: 'Visit https://platform.openai.com/account/billing to add credits',
          billingUrl: 'https://platform.openai.com/account/billing'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limited',
        details: 'Too many requests. Please wait a moment.',
        suggestion: 'Wait a few seconds and try again'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!testResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `API error: ${testResponse.status}`,
        suggestion: 'Check your OpenAI account status'
      }), {
        status: testResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'API key is working correctly',
      keyFormat: OPENAI_API_KEY.startsWith('sk-proj-') ? 'Project-scoped (new format)' : 'Standard format',
      suggestion: 'Your API key is valid. If you\'re getting quota errors, please add credits to your account.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to check API status',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 