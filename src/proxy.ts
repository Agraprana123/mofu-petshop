import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";

// Halaman yang TIDAK memerlukan login
const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewatkan asset statis dan API internal Next.js
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookie(cookieHeader);
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Jika halaman publik dan tidak ada token, langsung izinkan
  if (isPublicPath && !token) {
    return NextResponse.next();
  }

  const session = token ? await verifyToken(token) : null;

  // Sudah login tapi akses halaman login → redirect ke dashboard
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Belum login tapi akses halaman protected → redirect ke login
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

