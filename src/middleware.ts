import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("admin_auth")?.value;
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api") || path === "/login") return NextResponse.next();
  if (!auth) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
