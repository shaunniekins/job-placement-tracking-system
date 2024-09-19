"use client";

import { RootState } from "@/app/reduxUtils/store";
import { useHandleLogout } from "@/utils/authUtils";
import { Avatar, Button, Image } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBars, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import { useSelector } from "react-redux";

interface HeaderComponentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

const HeaderComponent = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setIsLoading,
}: HeaderComponentProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userType, setUserType] = useState("");

  useEffect(() => {
    if (pathname.includes("superadmin")) {
      setUserType("superadmin");
    } else if (pathname.includes("admin")) {
      setUserType("admin");
    } else if (pathname.includes("agency")) {
      setUserType("agency");
    } else if (pathname.includes("alumni")) {
      setUserType("alumni");
    }
  }, [pathname]);

  let display = "";
  if (pathname === "/admin/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/admin/monitor") {
    display = "Monitor Chats";
  } else if (pathname === "/admin/users") {
    display = "Users";
  } else if (pathname === "/admin/settings") {
    display = "Settings";
  } else if (pathname === "/admin/report") {
    display = "Report";
  } else if (pathname === "/superadmin/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/superadmin/jobinteraction") {
    display = "Job Interaction";
  } else if (pathname === "/superadmin/validation") {
    display = "Validation";
  } else if (pathname === "/superadmin/notifications") {
    display = "Notifications";
  } else if (pathname === "/superadmin/users") {
    display = "Users";
  } else if (pathname === "/superadmin/manage") {
    display = "Manage";
  } else if (pathname === "/superadmin/history") {
    display = "History";
  } else if (pathname === "/superadmin/profile") {
    display = "Profile";
  } else if (pathname === "/superadmin/orgchart") {
    display = "Org Chart";
  } else if (pathname === "/superadmin/calendar") {
    display = "Calendar";
  } else if (pathname === "/agency/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/agency/managejobpostings") {
    display = "Manage Job Postings";
  } else if (pathname === "/agency/applicants") {
    display = "Applicants";
  } else if (pathname === "/agency/notifications") {
    display = "Notifications";
  } else if (pathname === "/agency/profile") {
    display = "Profile";
  } else if (pathname === "/agency/settings") {
    display = "Settings";
  } else if (pathname === "/alumni/dashboard") {
    display = "Dashboard";
  } else if (pathname === "/alumni/placement") {
    display = "Placement";
  } else if (pathname === "/alumni/notifications") {
    display = "Notifications";
  } else if (pathname === "/alumni/profile") {
    display = "Profile";
  } else if (pathname === "/alumni/settings") {
    display = "Settings";
  }

  const handleLogout = useHandleLogout();

  const onLogoutClick = () => {
    setIsLoading(true);
    handleLogout();
  };

  const [isMdOrAbove, setIsMdOrAbove] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMdOrAbove(window.innerWidth >= 768);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="w-full flex flex-col">
      <div className="h-14 w-full bg-[#007057] text-white flex justify-between items-center px-3">
        <div className="flex items-center gap-2 z-0">
          <Image
            src="/images/asscat-logo.png"
            alt="logo"
            width="50"
            height="50"
          />
          <h1 className="hidden lg:block font-semibold text-2xl">
            Job Placement Tracking System
          </h1>
          <h1 className="lg:hidden">JPTS</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color={"secondary"}
            size={isMdOrAbove ? "sm" : "md"}
            isIconOnly={!isMdOrAbove}
            startContent={<FaCalendarAlt />}
            className={`${userType !== "agency" && userType !== "alumni" ? "hidden" : ""}`}
            onClick={() => userType && router.push(`/${userType}/calendar`)}
          >
            {isMdOrAbove && "Calendar"}
          </Button>
          <Button
            color={"danger"}
            size={isMdOrAbove ? "sm" : "md"}
            isIconOnly={!isMdOrAbove}
            startContent={<FaSignOutAlt />}
            onClick={onLogoutClick}
          >
            {isMdOrAbove && "Signout"}
          </Button>
        </div>
      </div>
      <div className="w-full bg-[#F4FFFC] flex justify-between items-center px-5">
        <button
          className="flex h-11 items-center gap-2"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <FaBars className="text-xl" />
          <div>{display}</div>
        </button>
      </div>
    </div>
  );
};

export default HeaderComponent;
