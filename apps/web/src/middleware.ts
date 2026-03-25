import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/checkout", "/orders", "/account"] as const;
const ADMIN_PREFIX = "/admin";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAdmin =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);

  if ((isProtected || isAdmin) && !token) {
    const loginUrl = new URL("/login", req.url);
    const callbackPath = `${pathname}${search ?? ""}`;
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/account/:path*",
  ],
};
