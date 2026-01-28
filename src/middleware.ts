import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/api/auth"]
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  )

  // API routes with token auth (existing task API)
  if (pathname.startsWith("/api/tasks")) {
    // Keep existing token-based auth for API
    return NextResponse.next()
  }

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token")

  if (!sessionCookie) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
