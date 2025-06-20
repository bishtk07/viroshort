export async function POST({ request }) {
  try {
    const body = await request.json();
    const { prompt, voiceSettings } = body;

    // Use fetch instead of the Replicate SDK to avoid Node.js dependencies
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${import.meta.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "4ce3d6ef7c1e7bf8b6d2ea2b5bbfe0ccae3b3208b8b6b5e5e5e5e5e5e5e5e5e5",
        input: {
          prompt: prompt,
          duration: "5",
          fps: 8,
          aspect_ratio: "16:9"
        }
      })
    });

    const prediction = await replicateResponse.json();
    
    return new Response(JSON.stringify(prediction), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate video' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 