// app/alumni/[idName]/AlumniClientRouter.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import ProfileComponent from "@/components/Profile";
import AlumniDashboardComponent from "@/components/alumniComponents/Dashboard";
import PlacementComponent from "@/components/alumniComponents/Placement";
import NotificationsComponent from "@/components/Notifications";
import CalendarComponent from "@/components/superAdminComponents/Calendar";
import OrgChartComponent from "@/components/superAdminComponents/OrgChart";

export default function AlumniClientRouter() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/alumni/dashboard")) {
      setDisplay(<AlumniDashboardComponent />);
    } else if (pathname.startsWith("/alumni/placement")) {
      setDisplay(<PlacementComponent />);
    } else if (pathname.startsWith("/alumni/notifications")) {
      setDisplay(<NotificationsComponent />);
    } else if (pathname.startsWith("/alumni/profile")) {
      setDisplay(<ProfileComponent />);
    } else if (pathname.startsWith("/alumni/orgchart")) {
      setDisplay(<OrgChartComponent />);
    } else if (pathname.startsWith("/alumni/calendar")) {
      setDisplay(<CalendarComponent />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
