import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Routes that require a signed-in customer. */
const PROTECTED = ["/dashboard", "/investments", "/transactions", "/withdraw", "/profile", "/security"];

/** Routes a signed-in customer should not land on. */
const AUTH_ONLY = ["/login", "/signup"];

function isProtected(pathname: string) {
  return PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAuthOnly(pathname: string) {
  return AUTH_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the auth token on every request and guards protected routes.
 *
 * The guard lives here rather than in the page so an unauthenticated request
 * never reaches code that reads financial records — it is redirected before
 * rendering begins.
 *
 * This runs on every request in the application, which makes it the worst
 * possible place to throw: an error here takes down the marketing site, the
 * login page and the dashboard alike. So a failure to reach the auth service
 * is treated as "no verified session" — public pages still render, and
 * anything behind the guard redirects to login rather than returning a 500.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });
  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    /* Unreachable auth service, or a build with no configuration. Fall
       through with no user: deny rather than assume a session. */
    console.error("[proxy] auth check failed; treating request as signed out", error);
  }

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnly(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
