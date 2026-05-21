import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkAccess } from './lib/access-control';

const PUBLIC_PATHS = ['/login', '/api/auth', '/access-denied', '/api/cron'];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiRoute = pathname.startsWith('/api/');

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token) {
    if (isPublicPath || isApiRoute) return NextResponse.next();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Private mode access control (uses data from JWT — no DB query)
  if (!isPublicPath && process.env.APP_ACCESS_MODE === 'private') {
    const { allowed } = checkAccess(
      token.email as string | undefined,
      token.spotifyId as string | undefined
    );
    if (!allowed) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
