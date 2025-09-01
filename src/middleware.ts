import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/auth";

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/api/auth/callback/google"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith("/api/auth"));

  // Child permalink routes are public
  const isChildPermalinkRoute = pathname.startsWith("/child/");

  if (isPublicRoute || isChildPermalinkRoute) {
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Role-based access control
    if (pathname.startsWith("/dashboard/parent") && session.user.role !== "PARENT") {
      return NextResponse.redirect(new URL("/dashboard/child", request.url));
    }

    if (pathname.startsWith("/dashboard/child") && session.user.role !== "CHILD") {
      return NextResponse.redirect(new URL("/dashboard/parent", request.url));
    }

    if (pathname.startsWith("/onboarding") && session.user.role !== "PARENT") {
      return NextResponse.redirect(new URL("/dashboard/child", request.url));
    }
  }

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