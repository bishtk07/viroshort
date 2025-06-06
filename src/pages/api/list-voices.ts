import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Fetch voices directly from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': import.meta.env.ELEVEN_LABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices from ElevenLabs');
    }

    const data = await response.json();
    
    // Transform and categorize voices
    const voices = data.voices.map((voice: any) => {
      // Premium voices are those that are marked as professional or have high quality settings
      const isPremium = 
        voice.category === 'professional' || 
        voice.high_quality_base_model_ids?.length > 0 ||
        ['rachel', 'domi', 'bella', 'antoni', 'elli', 'josh', 'arnold', 'adam', 'sam'].includes(voice.name.toLowerCase());

      return {
        voice_id: voice.voice_id,
        name: voice.name,
        category: isPremium ? 'premium' : 'standard',
        labels: {
          accent: voice.labels?.accent || '',
          description: voice.description || voice.labels?.description || voice.labels?.gender || ''
        },
        preview_url: voice.preview_url
      };
    }).sort((a: any, b: any) => {
      // Sort premium voices first, then by name
      if (a.category === 'premium' && b.category !== 'premium') return -1;
      if (a.category !== 'premium' && b.category === 'premium') return 1;
      return a.name.localeCompare(b.name);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        voices 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching voices:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch voices' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 