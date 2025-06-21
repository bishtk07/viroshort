import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), { status: 401 });
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Invalid authentication token' 
      }), { status: 401 });
    }

    // Try to get existing profile
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits_available, plan_type')
      .eq('id', user.id)
      .single();

    if (existingProfile && !profileError) {
      // Profile already exists
      return new Response(JSON.stringify({
        credits: existingProfile.credits_available,
        planType: existingProfile.plan_type,
        isNew: false
      }), { status: 200 });
    }

    // Try to create new profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        credits_available: 1,
        plan_type: 'free'
      })
      .select()
      .single();

    if (createError) {
      // If table doesn't exist or other error, return default
      return new Response(JSON.stringify({
        credits: 1,
        planType: 'free',
        isNew: true,
        setupRequired: true
      }), { status: 200 });
    }

    // Also create initial transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        type: 'bonus',
        amount: 1,
        description: 'Welcome bonus - 1 free credit'
      });

    return new Response(JSON.stringify({
      credits: newProfile.credits_available,
      planType: newProfile.plan_type,
      isNew: true
    }), { status: 200 });

  } catch (error) {
    console.error('Init credits error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize credits',
      details: error instanceof Error ? error.message : String(error)
    }), { status: 500 });
  }
}; 