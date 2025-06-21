// Utility functions for authentication that work both client and server side

export function getCookie(name: string, cookies?: string): string | null {
  // Server-side: cookies are passed as a string
  if (cookies) {
    const cookieArray = cookies.split(';').map(c => c.trim());
    const cookie = cookieArray.find(c => c.startsWith(`${name}=`));
    if (cookie) {
      return decodeURIComponent(cookie.split('=')[1]);
    }
    return null;
  }
  
  // Client-side: use document.cookie
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

export function getSessionFromCookie(cookieValue?: string): { access_token: string; refresh_token: string } | null {
  // If cookieValue is provided directly, use it
  let authCookie: string | null = null;
  
  if (cookieValue) {
    // Direct cookie value provided (from middleware)
    authCookie = cookieValue;
  } else {
    // Try to get from document.cookie (client-side)
    authCookie = getCookie('supabase-auth-token');
  }
  
  if (!authCookie) {
    console.log('🍪 No auth cookie found');
    return null;
  }
  
  try {
    const session = JSON.parse(authCookie);
    if (session && session.access_token && session.refresh_token) {
      console.log('✅ Session parsed successfully');
      return session;
    } else {
      console.log('❌ Session missing required tokens:', { 
        hasAccessToken: !!session?.access_token, 
        hasRefreshToken: !!session?.refresh_token 
      });
    }
  } catch (e) {
    console.error('❌ Failed to parse auth cookie:', e);
    console.log('🔍 Cookie content preview:', authCookie?.substring(0, 100) + '...');
  }
  
  return null;
} 