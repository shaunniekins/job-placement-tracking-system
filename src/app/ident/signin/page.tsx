// src/app/signin/page.tsx

"use client";

import SigninComponent from "@/components/Signin";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react"; // Import Suspense
import { Spinner } from "@nextui-org/react"; // Import a loading indicator

// Create a wrapper component to handle Suspense
function SigninPageContent() {
  const searchParams = useSearchParams();
  const userType = searchParams.get("usertype") || "defaultUserType"; // Provide a default value

  return <SigninComponent userType={userType} />;
}

export default function SigninPage() {
  return (
    // Wrap the component using useSearchParams in Suspense
    <Suspense
      fallback={
        <div className="h-full w-full flex justify-center items-center">
          <Spinner color="success" />
        </div>
      }
    >
      <SigninPageContent />
    </Suspense>
  );
}
