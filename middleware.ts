import { auth } from "~/server/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If trying to access protected route without auth, redirect to home
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Continue with the request
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}