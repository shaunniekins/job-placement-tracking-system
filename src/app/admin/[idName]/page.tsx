"use client";

import ProfileComponent from "@/components/Profile";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardComponent from "@/components/superAdminComponents/Dashboard";
import OrgChartComponent from "@/components/superAdminComponents/OrgChart";
import CalendarComponent from "@/components/superAdminComponents/Calendar";
import AlumniUserComponent from "@/components/adminComponents/AlumniUser";
import ReportsPC from "@/components/pcComponents/Reports";

export default function AdminSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/admin/dashboard")) {
      setDisplay(<DashboardComponent />);
    } else if (pathname.startsWith("/admin/alumni")) {
      setDisplay(<AlumniUserComponent />);
    } else if (pathname.startsWith("/admin/reports")) {
      setDisplay(<ReportsPC />);
    } else if (pathname.startsWith("/admin/profile")) {
      setDisplay(<ProfileComponent />);
    } else if (pathname.startsWith("/admin/orgchart")) {
      setDisplay(<OrgChartComponent />);
    } else if (pathname.startsWith("/admin/calendar")) {
      setDisplay(<CalendarComponent />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
