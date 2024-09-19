"use client";

import ApplicationsComponent from "@/components/agencyComponents/Applications";
import ManageJobPostingsComponent from "@/components/agencyComponents/ManageJobPostings";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AgencySlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/agency/dashboard")) {
      setDisplay("Dashboard");
    } else if (pathname.startsWith("/agency/managejobpostings")) {
      setDisplay(<ManageJobPostingsComponent />);
    } else if (pathname.startsWith("/agency/applicants")) {
      setDisplay(<ApplicationsComponent />);
    } else if (pathname.startsWith("/agency/notifications")) {
      setDisplay("Notifications");
    } else if (pathname.startsWith("/agency/profile")) {
      setDisplay("Profile");
    } else if (pathname.startsWith("/agency/settings")) {
      setDisplay("Settings");
    } else {
      setDisplay("No page found");
    }
  }, [pathname]);

  return <div className="h-full w-full">{display}</div>;
}
