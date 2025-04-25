"use client";

import ProfileComponent from "@/components/Profile";
import NotificationsComponent from "@/components/Notifications";
import CalendarComponent from "@/components/superAdminComponents/Calendar";
import DashboardComponent from "@/components/superAdminComponents/Dashboard";
import ManageEvents from "@/components/superAdminComponents/ManageActivities";
import OrgChartComponent from "@/components/superAdminComponents/OrgChart";
import UserComponent from "@/components/superAdminComponents/Users";
import ValidationComponent from "@/components/superAdminComponents/Validation";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import JobInteractionComponent from "@/components/superAdminComponents/JobInteraction";
import GTSComponent from "@/components/superAdminComponents/GTS";

export default function SuperAdminSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/superadmin/dashboard")) {
      setDisplay(<DashboardComponent />);
    } else if (pathname.startsWith("/superadmin/jobinteraction")) {
      setDisplay(<JobInteractionComponent />);
    } else if (pathname.startsWith("/superadmin/validation")) {
      setDisplay(<ValidationComponent />);
    } else if (pathname.startsWith("/superadmin/users")) {
      setDisplay(<UserComponent />);
    } else if (pathname.startsWith("/superadmin/manage")) {
      setDisplay(<ManageEvents />);
    } else if (pathname.startsWith("/superadmin/profile")) {
      setDisplay(<ProfileComponent />);
    } else if (pathname.startsWith("/superadmin/orgchart")) {
      setDisplay(<OrgChartComponent />);
    } else if (pathname.startsWith("/superadmin/calendar")) {
      setDisplay(<CalendarComponent />);
    } else if (pathname.startsWith("/superadmin/gts")) {
      setDisplay(<GTSComponent />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
