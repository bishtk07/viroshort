import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

// Define public routes that don't require authentication
const publicRoutes = ['/landing', '/api/paddle-webhook'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Allow public routes and API routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return next();
  }
  
  // Check if user is authenticated
  const cookies = context.cookies;
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  
  // If no tokens, redirect to landing
  if (!accessToken || !refreshToken) {
    console.log('No tokens found, redirecting to landing...');
    return context.redirect('/landing');
  }
  
  // Verify the session is valid
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log('Invalid session, redirecting to landing...', error);
      // Clear invalid cookies
      cookies.delete('sb-access-token');
      cookies.delete('sb-refresh-token');
      return context.redirect('/landing');
    }
    
    // Valid session, continue
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return context.redirect('/landing');
  }
}); 