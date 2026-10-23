import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { PROFILE_COOKIE, isOnboarded } from "@/lib/hub/profile";
import { redirectFor } from "@/lib/hub/routing";

// Optimistic sign-in check (Next.js 16 authentication guide): reads only the session cookie and
// redirects. It is not security; the prototype has no real accounts (see docs/DECISIONS.md).
export function proxy(request: NextRequest) {
  const email = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const visitor = {
    signedIn: email !== "",
    onboarded: email !== "" && isOnboarded(email, request.cookies.get(PROFILE_COOKIE)?.value),
    signingUp: Boolean(request.cookies.get(SIGNUP_COOKIE)?.value),
  };
  const target = redirectFor(request.nextUrl.pathname, request.nextUrl.search, visitor);
  return target ? NextResponse.redirect(new URL(target, request.url)) : NextResponse.next();
}

// Skip Next.js build files, image optimisation, and static images so pages can load them.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
