// src/app/signup/page.tsx

"use client";

import SignupComponent from "@/components/Signup";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react"; // Import Suspense
import { Spinner } from "@nextui-org/react"; // Import a loading indicator

// Create a wrapper component to handle Suspense
function SignupPageContent() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("usertype") || "defaultUserType"; // Provide a default value

  return <SignupComponent userType={userType} />;
}

export default function SignupPage() {
  // Renamed from SigninPage to SignupPage
  return (
    // Wrap the component using useSearchParams in Suspense
    <Suspense
      fallback={
        <div className="h-full w-full flex justify-center items-center">
          <Spinner color="success" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
