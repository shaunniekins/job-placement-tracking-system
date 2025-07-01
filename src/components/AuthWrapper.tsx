"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { supabase } from "@/utils/supabase";
import { setUser, clearUser } from "@/app/reduxUtils/userSlice";
import { Spinner } from "@nextui-org/react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser();

        if (supabaseUser) {
          dispatch(setUser(supabaseUser));

          const userType = supabaseUser.user_metadata?.user_type;
          const userStatus = supabaseUser.user_metadata?.account_status;

          // Check if user needs approval
          if (
            (userType === "admin" ||
              userType === "agency" ||
              userType === "alumni") &&
            userStatus !== "approved"
          ) {
            await supabase.auth.signOut();
            dispatch(clearUser());
            router.push("/ident/confirmation");
            return;
          }

          // Handle redirects based on current path and user type - only for specific paths
          if (pathname === "/") {
            if (
              userType === "admin" ||
              userType === "agency" ||
              userType === "alumni"
            ) {
              router.push(`/${userType}/dashboard`);
            } else {
              router.push("/superadmin/dashboard");
            }
            return;
          }

          // Redirect from auth pages if already logged in
          if (pathname.startsWith("/ident")) {
            if (
              userType === "admin" ||
              userType === "agency" ||
              userType === "alumni"
            ) {
              router.push(`/${userType}/dashboard`);
            } else {
              router.push("/superadmin/dashboard");
            }
            return;
          }

          // Check access permissions for protected routes only
          if (pathname.startsWith("/admin") && userType !== "admin") {
            router.push("/");
            return;
          }
          if (pathname.startsWith("/agency") && userType !== "agency") {
            router.push("/");
            return;
          }
          if (pathname.startsWith("/alumni") && userType !== "alumni") {
            router.push("/");
            return;
          }
          if (
            pathname.startsWith("/superadmin") &&
            userType !== "superadmin" &&
            userType
          ) {
            router.push("/");
            return;
          }
        } else {
          dispatch(clearUser());

          // Only redirect unauthenticated users from protected routes, NOT from auth routes
          if (
            pathname.startsWith("/superadmin") ||
            pathname.startsWith("/admin") ||
            pathname.startsWith("/agency") ||
            pathname.startsWith("/alumni")
          ) {
            router.push("/");
            return;
          }

          // Allow access to all other routes including /ident/ routes
        }
      } catch (error) {
        console.error("Auth check error:", error);
        dispatch(clearUser());
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        dispatch(clearUser());
        // Don't automatically redirect on sign out, let the user stay where they are
        // unless they're on a protected route
        if (
          pathname.startsWith("/superadmin") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/agency") ||
          pathname.startsWith("/alumni")
        ) {
          router.push("/");
        }
      } else if (session?.user) {
        dispatch(setUser(session.user));
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, dispatch]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex justify-center items-center">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  return <>{children}</>;
}
