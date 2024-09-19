"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AlumniSlugPage() {
  const pathname = usePathname();
  const [display, setDisplay] = useState<string | JSX.Element>("");

  useEffect(() => {
    if (pathname.startsWith("/alumni/dashboard")) {
      setDisplay("Dashboard");
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

  return <div className="h-full w-full">{display}</div>;
}
