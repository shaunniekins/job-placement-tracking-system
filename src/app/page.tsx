"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@nextui-org/react";
import { useRouter } from "next/navigation";

// Define user types for better management
const userTypes = [
  {
    id: "superadmin",
    name: "Super Admin",
    description: "Full access",
    icon: "SA",
  },
  { id: "admin", name: "Admin", description: "Dean/ARO", icon: "AD" },
  {
    id: "program-chair",
    name: "Chair",
    description: "Program specific",
    icon: "PC",
  },
  {
    id: "agency",
    name: "Agency",
    description: "Agency specific",
    icon: "AG",
  },
  {
    id: "alumni",
    name: "Alumni",
    description: "Alumni access",
    icon: "AL",
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);

  const handleSelect = (userType: string) => {
    setSelectedUserType(userType);
  };

  const handleChoose = () => {
    if (selectedUserType) {
      router.push(`/ident/signin?usertype=${selectedUserType}`);
    }
  };

  return (
    <>
      <div className="bg-gray-100 h-[100svh] w-screen flex flex-col justify-center items-center p-4 relative">
        {/* Application Title (Absolute Positioned) */}
        <div className="absolute top-20 left-0 right-0 text-center hidden md:block">
          <h1 className="text-3xl font-bold text-gray-800">
            Job Placement Tracking System
          </h1>
          <p className="text-xl text-[#008B47] font-semibold">(JPTS)</p>
        </div>

        {/* Role Selection Card */}
        <Card className="w-full max-w-3xl h-auto shadow-xl rounded-xl">
          <CardHeader className="bg-[#008B47] flex justify-center items-center py-4 rounded-t-xl">
            <p className="text-center text-white text-xl font-medium">
              Select Your Role
            </p>
          </CardHeader>
          <CardBody className="p-3">
            {/* Grid layout for user types */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {userTypes.map((user) => (
                <div
                  key={user.id}
                  className={`flex flex-col items-center justify-center text-center p-4 rounded-lg cursor-pointer transition-all duration-200 ease-in-out aspect-square ${
                    selectedUserType === user.id
                      ? "bg-[#E6F4EF] ring-2 ring-[#008B47] shadow-md" // Selected style
                      : "bg-gray-50 hover:bg-gray-200 hover:shadow-sm" // Default style
                  }`}
                  onClick={() => handleSelect(user.id)}
                >
                  {/* Icon Placeholder */}
                  <div className="mb-2 text-2xl font-bold text-[#008B47]">
                    {user.icon}
                  </div>
                  {/* Text content */}
                  <p className="font-semibold text-sm text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {user.description}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter className="flex justify-center items-center p-4 border-t border-gray-200">
            <Button
              fullWidth
              size="lg"
              radius="lg"
              isDisabled={!selectedUserType}
              className={`text-white font-semibold transition-all duration-200 ease-in-out w-full max-w-xs ${
                selectedUserType
                  ? "bg-[#008B47] hover:bg-[#00753C] shadow-md hover:shadow-lg"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              onClick={handleChoose}
            >
              Choose
            </Button>
          </CardFooter>
        </Card>

        {/* Footer (Absolute Positioned) */}
        <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 hidden md:block">
          © {new Date().getFullYear()} Job Placement Tracking System. All rights
          reserved.
        </footer>
      </div>
    </>
  );
}
