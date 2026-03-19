export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all admin routes
    "/admin/:path*",
    // Protect checkout and account pages
    "/checkout/:path*",
    "/account/:path*",
    "/orders/:path*",
  ],
};
