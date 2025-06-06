// Cloudflare-compatible API utilities using fetch
export async function generateVideo(prompt, options = {}) {
  try {
    const response = await fetch('/api/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        ...options 
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Video generation error:', error);
    throw error;
  }
}

export async function generateAudio(script, voiceId) {
  try {
    if (!script || !voiceId) {
      throw new Error('Script and voice ID are required');
    }

    const response = await fetch('/api/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        script,
        voiceId 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Audio API call failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Audio generation error:', error);
    throw error;
  }
}

export async function enhancePrompt(prompt) {
  try {
    const response = await fetch('/api/enhance-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`Prompt enhancement failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    throw error;
  }
} 