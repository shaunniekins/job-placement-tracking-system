"use client";

import ProfileComponent from "@/components/agencyComponents/Profile";
import AlumniDashboardComponent from "@/components/alumniComponents/Dashboard";
import PlacementComponent from "@/components/alumniComponents/Placement";
import NotificationsComponent from "@/components/Notifications";
import CalendarComponent from "@/components/superAdminComponents/Calendar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AlumniSlugPage() {
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
      // } else if (pathname.startsWith("/alumni/settings")) {
      //   setDisplay("Settings");
    } else if (pathname.startsWith("/alumni/calendar")) {
      setDisplay(<CalendarComponent />);
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
