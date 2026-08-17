import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/api/health"];
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicPaths.some((path) => pathname.startsWith(path)) || pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();
  if (!request.cookies.get("lk_session")) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
