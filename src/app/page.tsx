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

export default function Home() {
  const router = useRouter();

  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);

  const handleSelect = (userType: string) => {
    setSelectedUserType(userType);
  };

  const handleChoose = () => {
    router.push(`/ident/signin?usertype=${selectedUserType}`);
  };

  return (
    <>
      <div className="bg-[#F4FFFC] h-[100svh] w-screen flex justify-center items-center">
        <Card className="w-96 h-96 mx-3">
          <CardHeader className="bg-[#008B47] flex justify-center items-center">
            <p className="text-center text-white text-lg font-semibold">
              Select User Type
            </p>
          </CardHeader>
          <CardBody className="h-full flex flex-col justify-center">
            <div className="flex flex-col justify-around gap-2 px-2">
              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "superadmin" ? "border-[#007057]" : ""
                }`}
                onClick={() => handleSelect("superadmin")}
              >
                <p className="font-semibold">Super Admin</p>
                <p className="text-xs">
                  Has full access to all settings and data.
                </p>
              </div>

              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "administrator" ? "border-[#007057]" : ""
                }`}
                onClick={() => handleSelect("administrator")}
              >
                <p className="font-semibold">Administrator</p>
                <p className="text-xs">Dean, ARO and Program Chair</p>
              </div>

              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "agency" ? "border-[#007057]" : ""
                }`}
                onClick={() => handleSelect("agency")}
              >
                <p className="font-semibold">Agency</p>
                <p className="text-xs">
                  Handles agency-specific operations and data.
                </p>
              </div>

              <div
                className={`text-start border p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedUserType === "alumni" ? "border-[#007057]" : ""
                }`}
                onClick={() => handleSelect("alumni")}
              >
                <p className="font-semibold">Alumni</p>
                <p className="text-xs">
                  Accesses alumni resources and information.
                </p>
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-center items-center">
            <Button
              fullWidth
              radius="full"
              isDisabled={!selectedUserType}
              className="text-white self-center bg-[#008B47]"
              onClick={handleChoose}
            >
              Choose
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
