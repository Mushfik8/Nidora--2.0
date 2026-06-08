import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all /admin routes except /admin-login
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-login')) {
    const adminSession = request.cookies.get('nidora_admin_session')?.value;
    
    // Check for secure token
    if (adminSession !== 'secure_admin_token_2026') {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
