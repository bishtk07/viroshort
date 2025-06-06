import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const gameplayId = formData.get('gameplayId') as string;
    const style = formData.get('style') as 'pip' | 'side';
    const commentary = formData.get('commentary') as File;

    const session = await supabase.auth.getSession();
    
    if (!session.data.session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Get gameplay video details
    const { data: gameplay, error: gameplayError } = await supabase
      .from('gameplay_library')
      .select('*')
      .eq('id', gameplayId)
      .single();

    if (gameplayError || !gameplay) {
      return new Response(
        JSON.stringify({ error: 'Gameplay video not found' }),
        { status: 404 }
      );
    }

    // Create video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: session.data.session.user.id,
        type: 'gameplay',
        status: 'processing',
      })
      .select()
      .single();

    if (videoError) {
      throw new Error('Failed to create video record');
    }

    // Upload commentary to Supabase Storage
    const commentaryPath = `commentary/${video.id}/${commentary.name}`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(commentaryPath, commentary);

    if (uploadError) {
      throw new Error('Failed to upload commentary');
    }

    // Get commentary URL
    const { data: { publicUrl: commentaryUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(commentaryPath);

    // Compile video using Randi.dev
    const compileResponse = await fetch('https://api.randi.dev/v1/compile-gameplay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.RANDI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameplay_url: gameplay.video_url,
        commentary_url: commentaryUrl,
        style,
      }),
    });

    const { video_url: finalUrl } = await compileResponse.json();

    // Update video record with final URL
    await supabase
      .from('videos')
      .update({
        final_url: finalUrl,
        status: 'completed',
      })
      .eq('id', video.id);

    return new Response(
      JSON.stringify({ videoId: video.id }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating gameplay video:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate video' }),
      { status: 500 }
    );
  }
}; 