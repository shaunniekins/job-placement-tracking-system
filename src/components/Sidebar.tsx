"use client";

import { Avatar, Button } from "@nextui-org/react";
import { usePathname, useRouter } from "next/navigation";
import {
  FaBars,
  FaSignOutAlt,
  FaTachometerAlt,
  FaComments,
  FaChartBar,
  FaUsers,
  FaCog,
  FaBell,
  FaHistory,
  FaUser,
  FaSitemap,
  FaCalendarAlt,
  FaBriefcase,
  FaUserGraduate,
  FaUserAlt,
  FaUserCircle,
  FaTools,
} from "react-icons/fa";

import classNames from "classnames";
import { useHandleLogout } from "@/utils/authUtils";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";

interface SidebarComponentProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: JSX.Element;
}

const SidebarComponent = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarComponentProps) => {
  const user = useSelector((state: RootState) => state.user.user);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("");
  const [displayImage, setDisplayImage] = useState({
    profile_picture: "",
  });

  const adminItems: MenuItem[] = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/admin/monitor", label: "Monitor Chats", icon: <FaComments /> },
    { path: "/admin/users", label: "Users", icon: <FaUsers /> },
    { path: "/admin/settings", label: "Settings", icon: <FaCog /> },
    { path: "/admin/report", label: "Report", icon: <FaChartBar /> },
  ];

  const superAdminItems: MenuItem[] = [
    {
      path: "/superadmin/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    { path: "/superadmin/manage", label: "Manage Post", icon: <FaCog /> },
    {
      path: "/superadmin/validation",
      label: "Validation",
      icon: <FaChartBar />,
    },
    {
      path: "/superadmin/jobinteraction",
      label: "Job Interaction",
      icon: <FaComments />,
    },

    {
      path: "/superadmin/notifications",
      label: "Notifications",
      icon: <FaBell />,
    },
    { path: "/superadmin/users", label: "Users", icon: <FaUsers /> },
    {
      path: "/superadmin/calendar",
      label: "Calendar",
      icon: <FaCalendarAlt />,
    },
    { path: "/superadmin/orgchart", label: "Org Chart", icon: <FaSitemap /> },
    { path: "/superadmin/profile", label: "Profile", icon: <FaUser /> },
    {path: "/superadmin/settings", label: "Settings", icon: <FaTools />},
  ];

  const agencyItems: MenuItem[] = [
    {
      path: "/agency/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      path: "/agency/managejobpostings",
      label: "Manage Job Postings",
      icon: <FaBriefcase />,
    },
    {
      path: "/agency/applicants",
      label: "Applicants",
      icon: <FaUserGraduate />,
    },
    { path: "/agency/notifications", label: "Notifications", icon: <FaBell /> },
    { path: "/agency/profile", label: "Profile", icon: <FaUser /> },
    // { path: "/agency/settings", label: "Settings", icon: <FaCog /> },
  ];

  const alumniItems: MenuItem[] = [
    {
      path: "/alumni/dashboard",
      label: "Dashboard",
      icon: <FaTachometerAlt />,
    },
    { path: "/alumni/placement", label: "Placement", icon: <FaBriefcase /> },
    { path: "/alumni/notifications", label: "Notifications", icon: <FaBell /> },
    { path: "/alumni/profile", label: "Profile", icon: <FaUser /> },
    // { path: "/alumni/settings", label: "Settings", icon: <FaCog /> },
  ];

  useEffect(() => {
    if (user && user.user_metadata) {
      const {
        profile_picture,
        user_type,
        first_name,
        last_name,
        company_name,
      } = user.user_metadata;

      if (user_type === "agency" && company_name) {
        setName(company_name);
      } else if (user_type === "alumni" || user_type === "admin") {
        setName(`${first_name} ${last_name}`);
      } else if (user_type === "superadmin") {
        if (first_name || last_name) {
          setName(`${first_name} ${last_name}`);
        } else {
          setName("Superadmin");
        }
      } else {
        setName("Superadmin");
      }

      setUserType(user_type ? user_type : "superadmin");
      setDisplayImage({
        profile_picture: profile_picture || "",
      });

      // console.log("user_type", user_type ? user_type : "superadmin");

      switch (user_type) {
        case "admin":
          setItems(adminItems);
          break;
        case "agency":
          setItems(agencyItems);
          break;
        case "alumni":
          setItems(alumniItems);
          break;
        default:
          setItems(superAdminItems);
          break;
      }
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setIsSidebarOpen]);

  return (
    <div className="bg-[#008B47] text-white h-full w-full flex flex-col justify-center select-none relative">
      <div
        className={`${
          userType === "superadmin"
            ? "hidden lg:flex"
            : "flex lg:absolute lg:top-16 lg:left-1/2 lg:transform lg:-translate-x-1/2"
        } items-center justify-center text-9xl`}
      >
        <div className="flex flex-col justify-center items-center gap-2">
          {displayImage.profile_picture ? (
            <Avatar
              src={displayImage.profile_picture}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover cursor-pointer"
            />
          ) : (
            <FaUserCircle />
          )}
          <span className="text-lg">{name}</span>
        </div>
      </div>
      <h1
        className={`${
          userType !== "superadmin" && "hidden"
        } lg:hidden absolute top-3 left-5 text-xl font-semibold`}
      >
        JPTS
      </h1>
      <button
        className="lg:hidden absolute top-3 right-5 text-xl"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <FaBars />
      </button>
      <ul className="flex flex-col py-5 px-5">
        {items.map((item) => (
          <NavItem
            key={item.path}
            path={item.path}
            label={item.label}
            icon={item.icon}
            userType={userType}
          />
        ))}
      </ul>
    </div>
  );
};

export default SidebarComponent;

const NavItem = ({
  path,
  label,
  icon,
  userType,
}: {
  path: string;
  label: string;
  icon: JSX.Element;
  userType: string;
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = () => {
    router.push(path);
  };

  const isActive = pathname.startsWith(path);

  return (
    <li
      onClick={handleNavigation}
      className={classNames(
        "flex items-center gap-5 px-5 lg:text-xl rounded-lg cursor-pointer hover:bg-[#00503D]",
        {
          "bg-[#F4FFFC] text-black hover:bg-[#F4FFFC] hover:text-black":
            isActive,
          "py-4 lg:py-5": userType === "superadmin",
          "py-5": userType !== "superadmin",
        }
      )}
    >
      <span className="text-xl lg:text-2xl">{icon}</span>
      <span>{label}</span>
    </li>
  );
};
