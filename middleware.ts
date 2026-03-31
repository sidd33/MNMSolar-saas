import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/inngest(.*)',
  '/api/uploadthing(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  // 1. Protect non-public routes first
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // 2. Extract metadata
  const metadata = (sessionClaims as any)?.publicMetadata || {};
  const role = metadata?.role;
  const department = metadata?.department;

  // 3. Handle Dashboard Redirection
  if (userId && request.nextUrl.pathname === '/dashboard') {
    if (role === 'OWNER') {
      return NextResponse.redirect(new URL('/dashboard/owner', request.url));
    }
    if (role === 'EMPLOYEE' && department) {
      if (department === 'SALES') {
        return NextResponse.redirect(new URL('/dashboard/sales', request.url));
      }
      return NextResponse.redirect(new URL(`/dashboard/department/${department}`, request.url));
    }
  }

  // 4. Redirect logged-in users away from public auth pages
  if (userId && isPublicRoute(request) && !request.nextUrl.pathname.startsWith('/api')) {
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
