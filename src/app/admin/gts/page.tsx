"use client";

import GTSComponent from "@/components/superAdminComponents/GTS";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import { useRouter } from "next/navigation";

export default function AdminGTSPage() {
  const user = useSelector((state: RootState) => state.user.user);
  const router = useRouter();

  if (
    user?.user_metadata?.user_type === "admin" &&
    user?.user_metadata?.faculty_type !== "Program Chair"
  ) {
    router.replace("/admin/dashboard");
    return null;
  }

  return <GTSComponent />;
}
