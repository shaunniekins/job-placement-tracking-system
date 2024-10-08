"use client";

import AlumniDashboardComponent from "@/components/alumniComponents/Dashboard";
import PlacementComponent from "@/components/alumniComponents/Placement";
import NotificationsComponent from "@/components/Notifications";
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
      setDisplay("Profile");
      // } else if (pathname.startsWith("/alumni/settings")) {
      //   setDisplay("Settings");
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
