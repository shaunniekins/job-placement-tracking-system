// src/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { persistor } from "./app/reduxUtils/store";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    request.nextUrl.pathname === "/superadmin" ||
    request.nextUrl.pathname === "/superadministrator"
  ) {
    return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
  }

  if (
    request.nextUrl.pathname === "/admin" ||
    request.nextUrl.pathname === "/administrator"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (request.nextUrl.pathname === "/agency") {
    return NextResponse.redirect(new URL("/agency/dashboard", request.url));
  }

  if (request.nextUrl.pathname === "/alumni") {
    return NextResponse.redirect(new URL("/alumni/dashboard", request.url));
  }

  if (request.nextUrl.pathname === "/ident") {
    return NextResponse.redirect(new URL("/ident/signin", request.url));
  }

  if (request.nextUrl.pathname === "/signin") {
    return NextResponse.redirect(new URL("/ident/signin", request.url));
  }

  if (
    request.nextUrl.pathname === "/ident/signin" &&
    !request.nextUrl.searchParams.has("usertype")
  ) {
    return NextResponse.redirect(
      new URL("/ident/signin?usertype=alumni", request.url)
    );
  }

  if (request.nextUrl.pathname === "/signup") {
    return NextResponse.redirect(new URL("/ident/signup", request.url));
  }

  if (
    request.nextUrl.pathname === "/ident/signup" &&
    !request.nextUrl.searchParams.has("usertype")
  ) {
    return NextResponse.redirect(
      new URL("/ident/signup?usertype=alumni", request.url)
    );
  }

  if (user) {
    const user_type = user.user_metadata.user_type;
    const user_status = user.user_metadata.account_status;

    if (
      (user_type === "admin" ||
        user_type === "agency" ||
        user_type === "alumni") &&
      user_status !== "approved"
    ) {
      const { error } = await supabase.auth.signOut();

      if (!error) {
        persistor.purge();
      }
      return NextResponse.redirect(new URL("/ident/confirmation", request.url));
    }

    // Redirect users to their respective dashboards based on role
    if (request.nextUrl.pathname === "/") {
      if (
        user_type === "admin" ||
        user_type === "agency" ||
        user_type === "alumni"
      ) {
        return NextResponse.redirect(new URL(`/${user_type}`, request.url));
      } else {
        // Assuming any other role (like superadmin) should go to /superadmin/dashboard
        return NextResponse.redirect(
          new URL("/superadmin/dashboard", request.url)
        );
      }
    }

    // Redirect logged-in users from /signin or /signup to their respective dashboards
    if (request.nextUrl.pathname.startsWith("/ident")) {
      if (
        user_type === "admin" ||
        user_type === "agency" ||
        user_type === "alumni"
      ) {
        return NextResponse.redirect(new URL(`/${user_type}`, request.url));
      } else {
        // Assuming any other role (like superadmin) should go to /superadmin/dashboard
        return NextResponse.redirect(
          new URL("/superadmin/dashboard", request.url)
        );
      }
    }
    if (request.nextUrl.pathname.startsWith("/ident/confirmation")) {
      if (user_type === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (user_type === "agency") {
        return NextResponse.redirect(new URL("/agency", request.url));
      } else if (user_type === "alumni") {
        return NextResponse.redirect(new URL("/alumni", request.url));
      } else {
        return NextResponse.redirect(
          new URL("/superadmin/dashboard", request.url)
        );
      }
    }

    // Redirect users to their respective dashboards based on role
    if (
      request.nextUrl.pathname === "/admin" &&
      (user_type === "admin" ||
        user_type === "agency" ||
        user_type === "alumni")
    ) {
      return NextResponse.redirect(new URL(`/admin/dashboard`, request.url));
    }

    // Redirect non-admins to / if trying to access /admin
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      user_type !== "admin"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect non-agencies to / if trying to access /agency
    if (
      request.nextUrl.pathname.startsWith("/agency") &&
      user_type !== "agency"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Redirect non-alumnis to / if trying to access /alumni
    if (
      request.nextUrl.pathname.startsWith("/alumni") &&
      user_type !== "alumni"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    // If no user is logged in, redirect to home page for protected routes
    if (
      request.nextUrl.pathname.startsWith("/superadmin") ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/agency") ||
      request.nextUrl.pathname.startsWith("/alumni")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

// Optionally, specify which routes the middleware should run on
export const config = {
  matcher: [
    "/",
    "/ident",
    "/ident/:path*",
    "/signin",
    "/signup",
    "/superadmin",
    "/superadministrator",
    "/superadmin/:path*",
    "/admin",
    "/administrator",
    "/admin/:path*",

    "/agency",
    "/agency/:path*",
    "/alumni",
    "/alumni/:path*",
  ],
};
