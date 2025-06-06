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

export async function generateAudio(text, voice = 'alloy') {
  try {
    const response = await fetch('/api/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text,
        voice 
      })
    });

    if (!response.ok) {
      throw new Error(`Audio API call failed: ${response.status}`);
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