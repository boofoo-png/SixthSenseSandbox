import { NextResponse, type NextRequest } from "next/server";
import { optionsFor, startConnect } from "@/lib/social/meta/routes";

// Connect on Settings: sends the browser to Facebook Login for the business chosen in the top bar.
export function GET(request: NextRequest) {
  const outcome = startConnect(request.cookies, request.nextUrl.origin);
  const response = NextResponse.redirect(new URL(outcome.location, request.url));
  for (const change of outcome.cookies) {
    if (change.maxAge === 0) response.cookies.delete(change.name);
    else response.cookies.set(change.name, change.value, optionsFor(change));
  }
  return response;
}
