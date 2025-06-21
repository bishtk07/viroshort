import { defineMiddleware } from 'astro:middleware';
import { supabase } from './lib/supabase';
import { getSessionFromCookie } from './lib/auth-utils';

// Define public routes that don't require authentication
const publicRoutes = ['/landing', '/api/paddle-webhook', '/debug-auth', '/fix-database', '/debug-credits'];

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
  
  console.log(`🔍 Middleware: Checking auth for ${pathname}`);
  
  // Check if user is authenticated using the unified auth utils
  const cookieString = context.cookies.get('supabase-auth-token')?.value;
  const session = getSessionFromCookie(cookieString);
  
  console.log(`🍪 Cookie exists: ${!!cookieString}, Session parsed: ${!!session}`);
  
  // If no auth token, redirect to landing
  if (!session) {
    console.log(`⚠️  No auth session found for ${pathname}, but allowing access for debugging...`);
    // Temporarily disable redirect for debugging
    // return context.redirect('/landing');
    return next();
  }
  
  const accessToken = session.access_token;
  const refreshToken = session.refresh_token;
  
  // If no tokens in session, redirect to landing
  if (!accessToken || !refreshToken) {
    console.log(`❌ No tokens in session for ${pathname}, redirecting to landing...`);
    return context.redirect('/landing');
  }
  
  // Verify the session is valid
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      console.log('❌ Invalid session, redirecting to landing...', error);
      // Clear invalid cookies
      context.cookies.delete('supabase-auth-token');
      return context.redirect('/landing');
    }
    
    // Store user and session in context for server-side access
    context.locals.user = user;
    context.locals.session = session;
    
    // Log successful auth
    console.log(`✅ Middleware: User ${user.email} authenticated for ${pathname}`);
    
    // Valid session, continue
    return next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return context.redirect('/landing');
  }
}); 