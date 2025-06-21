import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';

// Define public routes that don't require authentication
const publicRoutes = ['/landing', '/api/paddle-webhook'];

// Define routes that should be ignored by middleware
const ignoredRoutes = ['.well-known', 'favicon.ico', '_astro'];

function shouldIgnoreRoute(pathname: string): boolean {
  return ignoredRoutes.some(route => pathname.includes(route));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Allow public routes, API routes, and ignored routes (like DevTools)
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/') || shouldIgnoreRoute(pathname)) {
    return next();
  }
  
  // Supabase client is always initialized
  
  // Check if user is authenticated
  const cookies = context.cookies;
  
  // Look for the auth cookie
  const authToken = cookies.get('supabase-auth-token')?.value;
  
  // If no auth token, redirect to landing
  if (!authToken) {
    console.log(`No auth token found for ${pathname}, redirecting to landing...`);
    return context.redirect('/landing');
  }
  
  // Parse the auth token to get access and refresh tokens
  let session;
  try {
    session = JSON.parse(authToken);
  } catch (error) {
    console.log(`Invalid auth token for ${pathname}, redirecting to landing...`);
    return context.redirect('/landing');
  }
  
  const accessToken = session?.access_token;
  const refreshToken = session?.refresh_token;
  
  // If no tokens in session, redirect to landing
  if (!accessToken || !refreshToken) {
    console.log(`No tokens in session for ${pathname}, redirecting to landing...`);
    return context.redirect('/landing');
  }
  
  // Verify the session is valid
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log('Invalid session, redirecting to landing...', error);
      // Clear invalid cookies
      cookies.delete('supabase-auth-token');
      return context.redirect('/landing');
    }
    
    // Valid session, continue
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return context.redirect('/landing');
  }
}); 