import { NextResponse, type NextRequest } from "next/server";
import { finishConnect, optionsFor } from "@/lib/social/meta/routes";

// Facebook Login sends the browser back here (a Valid OAuth Redirect URI in the Meta app).
export async function GET(request: NextRequest) {
  const outcome = await finishConnect(request.cookies, request.nextUrl.searchParams, request.nextUrl.origin);
  const response = NextResponse.redirect(new URL(outcome.location, request.url));
  for (const change of outcome.cookies) {
    if (change.maxAge === 0) response.cookies.delete(change.name);
    else response.cookies.set(change.name, change.value, optionsFor(change));
  }
  return response;
}
