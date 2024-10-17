// src/components/Signup.tsx

"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/utils/supabase";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@nextui-org/react";
import { EyeSlashFilledIcon } from "../../public/icons/EyeSlashFilledIcon";
import { EyeFilledIcon } from "../../public/icons/EyeFilledIcon";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaCheck } from "react-icons/fa";
import {
  colleges,
  programs,
  scholarships,
} from "@/app/api/collegeAndProgramData";

interface SignupComponentProps {
  userType: string;
}

const SignupComponent = ({ userType }: SignupComponentProps) => {
  const [isInputUserPasswordVisible, setIsInputUserPasswordVisible] =
    useState(false);
  const [signupPending, setSignUpPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // exlusive for ageny
  const [validId, setValidId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // exclusive for alumni
  const [birthDate, setBirthDate] = useState("");
  const [alumniAddress, setAlumniAddress] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [scholarship, setScholarship] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const [currentViewInput, setCurrentViewInput] = useState(1);
  const [isSignupConfirmationModalOpen, setIsSignupConfirmationModalOpen] =
    useState(false);

  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (currentViewInput === 1) {
      setCurrentViewInput(2);
      return;
    }

    setSignUpPending(true);

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        account_status: "pending",
        profile_picture: "",
        email: email,
        password: password,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        contact_number: contactNumber,
        ...(userType === "agency" && {
          valid_id: validId,
          company_name: companyName,
          company_type: companyType,
          address: companyAddress,
        }),
        ...(userType === "alumni" && {
          birth_date: "",
          address: alumniAddress,
          batch_year: batchYear,
          id_number: idNumber,
          college: college,
          program: program,
          scholarship: scholarship,
          profile_of_employment: "",
        }),
      },
    });

    if (error) {
      console.error("Error signing up:", error.message);
      alert(error.message);
      setSignUpPending(false);
    } else {
      router.push(`/ident/confirmation`);
      return;
    }
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        hideCloseButton={true}
        isOpen={isSignupConfirmationModalOpen}
        onOpenChange={setIsSignupConfirmationModalOpen}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col">
                Awaiting superadmin Approval
                <span className="text-xs font-normal">
                  Your account creation is currently under review.
                </span>
              </ModalHeader>
              <ModalBody>
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  <div className="bg-[#008B47] text-white p-5 rounded-full">
                    <FaCheck size={"2rem"} />
                  </div>
                  <p className="text-center">
                    You will receive an email notification once your
                    registration has been approved by the superadmin.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  className="bg-[#008B47] text-white self-center"
                  onClick={() =>
                    router.push(`/ident/signin?usertype=${userType}`)
                  }
                >
                  Okay, thanks!
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        {signupPending && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Spinner color="success" />
          </div>
        )}
        {!signupPending && (
          <>
            <form
              className="animate-in h-full flex flex-col w-full justify-center items-center gap-2 px-3 md:px-12 2xl:px-80"
              onSubmit={handleSubmit}
            >
              <div className="w-full overflow-y-auto flex flex-col justify-center items-center rounded-md shadow-sm gap-3 ">
                <h4 className="absolute top-10 lg:top-32 self-center lg:self-start font-semibold text-xl">
                  {userType !== "superadmin" && userType.toUpperCase()} REGISTER
                </h4>
                {currentViewInput === 1 && (
                  <>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="First Name"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Middle Name"
                        variant="bordered"
                        color="success"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Last Name"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="email"
                        label="Email"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Input
                        type={isInputUserPasswordVisible ? "text" : "password"}
                        label="Password"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        endContent={
                          <button
                            className="focus:outline-none"
                            type="button"
                            onClick={() =>
                              setIsInputUserPasswordVisible(
                                !isInputUserPasswordVisible
                              )
                            }
                          >
                            {isInputUserPasswordVisible ? (
                              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                            ) : (
                              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                            )}
                          </button>
                        }
                      />
                    </div>
                  </>
                )}

                {userType === "agency" && currentViewInput === 2 && (
                  <>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="Valid ID"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={validId}
                        onChange={(e) => setValidId(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Company Name"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Company Type"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={companyType}
                        onChange={(e) => setCompanyType(e.target.value)}
                      />
                    </div>

                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="Company Address"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Contact Number"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {userType === "alumni" && currentViewInput === 2 && (
                  <>
                    <div className="w-full flex flex-col lg:flex-row gap-2">
                      <Input
                        type="text"
                        label="ID Number"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Address"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={alumniAddress}
                        onChange={(e) => setAlumniAddress(e.target.value)}
                      />
                      <Input
                        type="text"
                        label="Contact Number"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>

                    <div className="w-full flex flex-col lg:grid lg:grid-cols-3 gap-2">
                      <Select
                        items={colleges}
                        label="College"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={college}
                        className="col-span-3"
                        onChange={(e) => setCollege(e.target.value)}
                      >
                        {colleges.map((item) => (
                          <SelectItem key={item.key}>{item.label}</SelectItem>
                        ))}
                      </Select>
                      <Select
                        items={programs}
                        label="Program"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={program}
                        className={`${!college && "hidden"} col-span-3`}
                        onChange={(e) => setProgram(e.target.value)}
                      >
                        {programs
                          .filter((program) => program.college === college)
                          .map((item) => (
                            <SelectItem key={item.key} value={item.key}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </Select>
                      <Select
                        items={scholarships}
                        label="Scholarship"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={scholarship}
                        onChange={(e) => setScholarship(e.target.value)}
                      >
                        {scholarships.map((item) => (
                          <SelectItem key={item.key}>{item.label}</SelectItem>
                        ))}
                      </Select>
                      <Input
                        type="text"
                        label="Batch Year"
                        variant="bordered"
                        color="success"
                        isRequired
                        value={batchYear}
                        onChange={(e) => setBatchYear(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="w-full flex gap-2">
                  <Button
                    fullWidth
                    color="warning"
                    size="lg"
                    startContent={<IoIosArrowBack />}
                    onClick={() => {
                      setCurrentViewInput(1);
                    }}
                    className={`${
                      (currentViewInput === 1 || signupPending) && "hidden"
                    } text-white mt-3`}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    type="submit"
                    color="success"
                    size="lg"
                    endContent={currentViewInput === 1 && <IoIosArrowForward />}
                    disabled={signupPending}
                    isDisabled={
                      currentViewInput === 1
                        ? !(
                            email &&
                            password.length >= 8 &&
                            firstName &&
                            lastName
                          )
                        : currentViewInput === 2
                        ? !(
                            email &&
                            password.length >= 8 &&
                            firstName &&
                            lastName &&
                            contactNumber &&
                            (userType !== "agency" ||
                              (validId &&
                                companyName &&
                                companyType &&
                                companyAddress)) &&
                            (userType !== "alumni" || college)
                          )
                        : true
                    }
                    className="text-white mt-3"
                  >
                    {signupPending
                      ? "Signing Up..."
                      : currentViewInput === 1
                      ? "Next"
                      : "Sign Up"}
                  </Button>
                </div>
              </div>
            </form>
            <Button
              type="submit"
              variant="ghost"
              isDisabled={userType === "superadmin" || userType === "admin"}
              color="success"
              onClick={() => {
                return router.push(`/ident/signin?usertype=${userType}`);
              }}
              className="absolute bottom-5"
            >
              Already Have An Account
            </Button>
          </>
        )}
      </div>
    </>
  );
};

export default SignupComponent;
