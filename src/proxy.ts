import { NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require auth
  const publicRoutes = ["/login", "/api/auth"]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // API routes handle their own auth via authorizeRequest()
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Check for session cookie (presence only - validation happens in API routes)
  // Note: We only check cookie existence here because middleware runs in Edge runtime
  // where Prisma/database access is not available. Actual session validation against
  // the database occurs in API routes via authorizeRequest() in Node.js runtime.
  const sessionCookie = request.cookies.get("better-auth.session_token")

  if (!sessionCookie) {
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
