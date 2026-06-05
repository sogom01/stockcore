import { NextRequest, NextResponse } from "next/server";

const PUBLIC = ["/login", "/api/auth"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some(p => pathname.startsWith(p));
  const hasSession = req.cookies.has("sc-session");

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
