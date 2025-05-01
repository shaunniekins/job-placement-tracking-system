"use client";

import React, { useState } from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Select,
  SelectItem,
  Textarea,
  Card,
} from "@nextui-org/react";
import useApplicationStatus from "@/hooks/useApplicationStatus";
import { updateApplicationStatus } from "@/app/api/applicationStatusIUD";
import { updateJobApplication } from "@/app/api/jobApplicationsIUD";
import { insertNotification } from "@/app/api/notificationsIUD";
import { sendEmailNotification } from "@/utils/compUtils";

interface ApplicationStatusModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentJobApplicationId: string;
  isReadOnly?: boolean;
  jobTitle?: string;
  applicantId?: string;
  applicantEmail?: string;
  applicantFirstName?: string;
  applicantLastName?: string;
  jobPostingId: number | null;
}

const ApplicationStatusModalComponent: React.FC<
  ApplicationStatusModalProps
> = ({
  isOpen,
  setIsOpen,
  currentJobApplicationId,
  isReadOnly,
  jobTitle,
  applicantId,
  applicantEmail,
  applicantFirstName,
  applicantLastName,
  jobPostingId,
}) => {
  const { applicationStatus } = useApplicationStatus(currentJobApplicationId);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>("");
  const [finalResult, setFinalResult] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const steps = [
    {
      name: "Applied",
      date: applicationStatus?.date_applied,
      completed: applicationStatus?.date_applied !== null,
      key: "date_applied",
      description: null,
    },
    {
      name: (
        <>
          <span className="hidden md:inline">Initial Interview</span>
          <span className="md:hidden">Interview</span>
        </>
      ),
      date: applicationStatus?.date_initial_interview,
      completed: applicationStatus?.date_initial_interview !== null,
      key: "date_initial_interview",
      description: applicationStatus?.description_initial_interview,
    },
    {
      name: "Exam",
      date: applicationStatus?.date_exam,
      completed:
        applicationStatus?.date_exam !== null ||
        applicationStatus?.date_final !== null,
      key: "date_exam",
      description: applicationStatus?.description_exam,
    },
    {
      name: "Result",
      date: applicationStatus?.date_final,
      completed: applicationStatus?.date_final !== null,
      key: "date_final",
      description: null,
    },
  ];

  const handleCircleClick = (stepKey: string) => {
    if (isReadOnly) return;
    if (stepKey === "date_applied") return;

    setCurrentStep(stepKey);
    setIsUpdateModalOpen(true);
    setNewDate(applicationStatus?.[stepKey] || "");

    // Set description based on step
    if (stepKey === "date_initial_interview") {
      setDescription(applicationStatus?.description_initial_interview || "");
    } else if (stepKey === "date_exam") {
      setDescription(applicationStatus?.description_exam || "");
    }

    if (stepKey === "date_final") {
      setFinalResult(applicationStatus?.final_result || "");
    }
  };

  const handleUpdate = async () => {
    if (currentStep && applicationStatus && applicantId && jobPostingId) {
      let updatedApplicationStatus: any = {
        [currentStep]: newDate || null,
      };

      let newStatus = "";
      let isAccepted = false;

      if (currentStep === "date_initial_interview") {
        newStatus = "interview";
        updatedApplicationStatus.description_initial_interview = description;
      } else if (currentStep === "date_exam") {
        newStatus = "examination";
        updatedApplicationStatus.description_exam = description;
      } else if (currentStep === "date_final") {
        updatedApplicationStatus = {
          date_final: new Date().toISOString() || null,
          final_result: finalResult || null,
        };
        newStatus = finalResult;
        if (finalResult === "accepted") {
          isAccepted = true;
        }
      }

      const response = await updateApplicationStatus(
        applicationStatus.application_status_id,
        {
          ...updatedApplicationStatus,
        }
      );

      if (!response && newStatus) {
        console.log(
          `[handleUpdate] Attempting updateJobApplication for ID: ${currentJobApplicationId} with status: ${newStatus}`
        );
        const responseJA = await updateJobApplication(
          parseInt(currentJobApplicationId),
          {
            application_status: newStatus,
          }
        );

        console.log(
          `[handleUpdate] Response from updateJobApplication:`,
          responseJA
        );

        if (responseJA && responseJA.length > 0) {
          console.log(
            `[handleUpdate] updateJobApplication successful for ID: ${currentJobApplicationId}. Proceeding with further actions.`
          );

          if (isAccepted) {
            try {
              const apiResponse = await fetch("/api/update-user-employment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: applicantId,
                  isEmployed: true,
                  jobTitle: jobTitle,
                }),
              });

              if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                console.error(
                  "Failed to update user employment status via API:",
                  errorData.error
                );
              } else {
                console.log(
                  `Successfully marked user ${applicantId} as employed.`
                );
              }
            } catch (apiError) {
              console.error("Error calling employment update API:", apiError);
            }
          }

          let message = "";
          switch (newStatus) {
            case "accepted":
              message = `Congratulations! Your application for the job posting: ${jobTitle} has been accepted. Your employment status has been updated.`;
              break;
            case "rejected":
              message = `We are sorry to inform you that your application for the job posting: ${jobTitle} has been rejected.`;
              break;
            case "interview":
              message = `The agency has decided to move forward with your application for the job posting: ${jobTitle} and would like to schedule an interview.`;
              break;
            case "examination":
              message = `The agency has decided to move forward with your application for the job posting: ${jobTitle} and would like to schedule an examination.`;
            default:
              message = "";
          }

          if (message && applicantId && applicantEmail) {
            await insertNotification({
              receiver_id: applicantId,
              message: message,
              url: `/alumni/placement?applicationId=${currentJobApplicationId}`,
            });

            const alumniSendEmailData = {
              email: applicantEmail,
              recipient_name: `${applicantFirstName || "Applicant"} ${
                applicantLastName || ""
              }`.trim(),
              subject: "Application Status Update",
              message: message,
            };

            await sendEmailNotification(alumniSendEmailData);
          }
        } else {
          console.error(
            `[handleUpdate] updateJobApplication failed or returned empty for ID: ${currentJobApplicationId}. Aborting further actions like incrementing count.`
          );
        }

        setIsUpdateModalOpen(false);
        setNewDate("");
        setFinalResult("");
        setDescription("");
      } else if (response) {
        console.error(
          "[handleUpdate] Error updating ApplicationStatus table:",
          response
        );
      } else if (!newStatus) {
        console.warn(
          "[handleUpdate] No new status determined, skipping JobApplications update."
        );
      }
    } else {
      console.error("Missing data for update:", {
        currentStep,
        applicationStatus,
        applicantId,
        jobPostingId,
      });
    }
  };

  return (
    <>
      <Modal
        size="2xl"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Application Status</ModalHeader>
              <ModalBody>
                <div className="w-full max-w-3xl mx-auto">
                  <div className="flex flex-col items-center justify-between">
                    <div className="flex w-full items-center justify-between mb-6">
                      {steps.map((step, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center w-1/4"
                          onClick={() => handleCircleClick(step.key)}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              step.completed
                                ? "bg-[#008B47] text-white"
                                : "bg-gray-200 text-gray-500"
                            } ${!isReadOnly ? "cursor-pointer" : ""}`}
                          >
                            {index + 1}
                          </div>
                          <div className="mt-2 mb-4 text-center">
                            <div className="text-sm font-medium">
                              {step.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {step.date ? step.date : "N/A"}
                            </div>
                          </div>
                          {index < steps.length - 1 && (
                            <div className="w-full h-1 bg-gray-200 relative">
                              <div
                                className={`absolute top-0 left-0 h-full bg-[#008B47]`}
                                style={{
                                  width: step.completed ? "100%" : "0%",
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Display descriptions */}
                    <div className="w-full mt-2">
                      {steps.map(
                        (step, index) =>
                          step.description && (
                            <Card
                              key={index}
                              className="p-3 mb-3 w-full bg-green-50 shadow-none rounded-lg text-sm"
                            >
                              <h3 className="font-semibold text-gray-600">
                                {step.name} Details:
                              </h3>
                              <p className="whitespace-pre-wrap mt-1">
                                {step.description}
                              </p>
                            </Card>
                          )
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  color="success"
                  variant="flat"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        size="md"
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Update Status</ModalHeader>
              <ModalBody>
                {currentStep !== "date_final" && (
                  <>
                    <Input
                      label="Date"
                      type="date"
                      color="success"
                      value={newDate || ""}
                      onChange={(e) => setNewDate(e.target.value)}
                    />
                    <Textarea
                      label="Description"
                      placeholder="Add details about this stage (e.g., interview details, exam instructions)"
                      color="success"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      minRows={3}
                      maxRows={5}
                    />
                  </>
                )}
                {currentStep === "date_final" && (
                  <Select
                    label="Result"
                    color="success"
                    variant="bordered"
                    defaultSelectedKeys={[finalResult]}
                    disabledKeys={["pending"]}
                    value={finalResult || ""}
                    onChange={(e) => setFinalResult(e.target.value)}
                  >
                    <SelectItem key={"pending"}>Pending</SelectItem>
                    <SelectItem key={"accepted"}>Accepted</SelectItem>
                    <SelectItem key={"rejected"}>Rejected</SelectItem>
                  </Select>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button color="primary" variant="flat" onClick={handleUpdate}>
                  Update
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default ApplicationStatusModalComponent;
