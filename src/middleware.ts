import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/api/auth/callback/google"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith("/api/auth"));

  // Child permalink routes are public
  const isChildPermalinkRoute = pathname.startsWith("/child/");

  if (isPublicRoute || isChildPermalinkRoute) {
    return NextResponse.next();
  }

  // For protected routes, let the page components handle auth checking
  // This avoids the Edge Runtime + Prisma compatibility issue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};