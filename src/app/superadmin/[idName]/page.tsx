"use client";

import OrgChartComponent from "@/components/superAdminComponents/OrgChart";
import UserComponent from "@/components/superAdminComponents/Users";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function SuperAdminSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/superadmin/dashboard")) {
      setDisplay("Dashboard");
    } else if (pathname.startsWith("/superadmin/jobinteraction")) {
      setDisplay("Job Interaction");
    } else if (pathname.startsWith("/superadmin/validation")) {
      setDisplay("Validation");
    } else if (pathname.startsWith("/superadmin/notifications")) {
      setDisplay("Notifications");
    } else if (pathname.startsWith("/superadmin/users")) {
      setDisplay(<UserComponent />);
    } else if (pathname.startsWith("/superadmin/manage")) {
      setDisplay("Manage");
    } else if (pathname.startsWith("/superadmin/history")) {
      setDisplay("History");
    } else if (pathname.startsWith("/superadmin/profile")) {
      setDisplay("Profile");
    } else if (pathname.startsWith("/superadmin/orgchart")) {
      setDisplay(<OrgChartComponent />);
    } else if (pathname.startsWith("/superadmin/calendar")) {
      setDisplay("Calendar");
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
