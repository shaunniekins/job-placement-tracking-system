"use client";

import HeaderComponent from "@/components/Header";
import SidebarComponent from "@/components/Sidebar";
import { Spinner } from "@nextui-org/react";
import { Suspense, useState, useEffect } from "react";
import { ValidationBadgeProvider } from "@/contexts/ValidationBadgeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import useGTS from "@/hooks/useGTS";
import GTSComponent from "@/components/GTS";
import { setUser } from "@/app/reduxUtils/userSlice";
import { supabase } from "@/utils/supabase";

export default function AlumniSlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const user = useSelector((state: RootState) => state.user?.user);
  const dispatch = useDispatch();
  const { gts, loadingGTS, refetchGTS } = useGTS(user?.id);
  const [showGTSModal, setShowGTSModal] = useState(false);

  useEffect(() => {
    if (
      user &&
      !loadingGTS &&
      gts &&
      gts.length === 0 &&
      user.user_metadata?.user_type === "alumni"
    ) {
      setShowGTSModal(true);
    } else {
      setShowGTSModal(false);
    }
  }, [user, loadingGTS, gts]);

  const reloadUser = async () => {
    setIsLoading(true);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user) {
      dispatch(setUser(user));
    }
    await refetchGTS();
    setIsLoading(false);
  };

  // Construct basic userInfo needed for GTSComponent
  const userInfo = user
    ? {
        ...user.user_metadata,
        birth_date: user.user_metadata?.birth_date || "",
        first_name: user.user_metadata?.first_name || "",
        middle_name: user.user_metadata?.middle_name || "",
        last_name: user.user_metadata?.last_name || "",
        contact_number: user.user_metadata?.contact_number || "",
        address: user.user_metadata?.address || "",
        email: user.email || "",
      }
    : {};

  const handleContentClick = () => {
    if (window.innerWidth < 1024) {
      // 1024px is the breakpoint for 'lg' in Tailwind CSS
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      <ValidationBadgeProvider>
        <NotificationProvider>
          {user && showGTSModal && (
            <GTSComponent
              userInfo={userInfo}
              currentUserId={user.id}
              openGPTSModal={showGTSModal}
              setOpenGPTSModal={setShowGTSModal}
              preventClose={true}
              reloadUser={reloadUser}
            />
          )}
          {isLoading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Spinner color="success" />
            </div>
          )}
          {!isLoading && (
            <div
              className={`h-[100svh] w-screen grid ${
                isSidebarOpen
                  ? "lg:grid-cols-[1fr_3fr] xl:grid-cols-[1fr_4fr]"
                  : "lg:grid-cols-1 xl:grid-cols-1"
              }`}
            >
              <div
                className={`${
                  isSidebarOpen ? "z-50 flex lg:block" : "hidden lg:hidden"
                } fixed inset-y-0 left-0 w-4/5 bg-white lg:relative lg:w-auto lg:bg-transparent`}
              >
                <SidebarComponent
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              </div>
              <div className="h-full flex flex-col w-full relative overflow-hidden">
                <div className="flex">
                  <HeaderComponent
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    setIsLoading={setIsLoading}
                  />
                </div>
                <Suspense
                  fallback={
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Spinner color="success" />
                    </div>
                  }
                >
                  <div
                    className="h-full flex bg-[#F4FFFC] justify-center items-center p-5"
                    onClick={handleContentClick}
                  >
                    {children}
                  </div>
                </Suspense>
              </div>
            </div>
          )}
        </NotificationProvider>
      </ValidationBadgeProvider>
    </>
  );
}
