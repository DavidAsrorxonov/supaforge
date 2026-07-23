import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_KEYS } from "@supaforge/constants";
import * as jose from "jose";
import { applyAuthCookiesToResponse } from "./features/auth/cookies";

const AUTH_ROUTES = ["/login", "/register"];

async function refreshSession(
  refreshToken: string,
  response: NextResponse,
): Promise<boolean> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return false;

  const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: `${COOKIE_KEYS.REFRESH_TOKEN}=${refreshToken}`,
    },
  });

  if (!refreshRes.ok) return false;

  applyAuthCookiesToResponse(response, refreshRes.headers.getSetCookie());
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_KEYS.REFRESH_TOKEN)?.value;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedRoute =
    pathname.startsWith("/organizations") || pathname.startsWith("/dashboard");

  let isValid = false;
  if (accessToken && process.env.JWT_SECRET_ACCESS) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET_ACCESS);
      await jose.jwtVerify(accessToken, secret);
      isValid = true;
    } catch {
      // this case means that token is invalid or expired
      isValid = false;
    }
  }

  if (isAuthRoute && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAuthRoute && refreshToken) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    if (await refreshSession(refreshToken, response)) {
      return response;
    }
  }

  if (isProtectedRoute && !isValid) {
    if (refreshToken) {
      const response = NextResponse.next();
      if (await refreshSession(refreshToken, response)) {
        return response;
      }
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
