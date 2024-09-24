"use client";

import AlumniDashboardComponent from "@/components/alumniComponents/Dashboard";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AlumniSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/alumni/dashboard")) {
      setDisplay(<AlumniDashboardComponent />);
    } else if (pathname.startsWith("/alumni/placement")) {
      setDisplay("Placement");
    } else if (pathname.startsWith("/alumni/notifications")) {
      setDisplay("Notifications");
    } else if (pathname.startsWith("/alumni/profile")) {
      setDisplay("Profile");
    } else if (pathname.startsWith("/alumni/settings")) {
      setDisplay("Settings");
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <>{display}</>;
}
