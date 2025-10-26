"use client";

import useAlumni from "@/hooks/useAlumni";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import GTSComponent from "../GTS";
import { useEffect, useState } from "react";
import DocumentComponent from "../DocumentComponent";
import { documentFiles } from "@/app/api/documentFiles";
import { formatDocumentKey, isMultipleDocumentType } from "@/utils/compUtils";
import { isUserSelfEmployed } from "@/utils/documentUtils";

interface AlumniProfileModalProps {
  alumniId: string;
  setAlumniId: (id: string) => void;
  openAlumniProfile: boolean;
  setOpenAlumniProfile: (isOpen: boolean) => void;
  userType?: string | "alumni";
  setUserType?: (userType: string) => void;
  viewerType?: string; // Who is viewing the profile (agency, admin, etc.)
}

interface AlumniData {
  profile_picture: string;
  is_currently_employed: string;
  is_course_aligned_with_job: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  contact_number: string;
  address: string;

  birth_date: string;
  college: string;
  program: string;
  scholarship: string;
  batch_year: string;
  [key: string]: any; // To allow additional properties
}

const AlumniProfileModal: React.FC<AlumniProfileModalProps> = ({
  alumniId,
  setAlumniId,
  openAlumniProfile,
  setOpenAlumniProfile,
  userType = "alumni",
  setUserType = () => {},
  viewerType = "alumni", // Default to alumni if not specified
}) => {
  const { alumniData } = useAlumni(alumniId, userType);

  const [openGPTSModal, setOpenGPTSModal] = useState(false);
  const [cleanAlumniData, setCleanAlumniData] = useState<AlumniData | null>(
    null
  );
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState<string[]>([]);
  const [employmentStatus, setEmploymentStatus] = useState("");

  // Define all document options based on viewer type (who is viewing)
  const allDocumentOptions =
    viewerType === "agency"
      ? documentFiles // Agency viewers can only see document files (no GTS)
      : [...documentFiles, "GTS"]; // Alumni and admin viewers can see all documents including GTS

  useEffect(() => {
    // Check employment status from GTS
    const checkEmploymentStatus = async () => {
      if (alumniId && userType === "alumni") {
        const isSelfEmployed = await isUserSelfEmployed(alumniId);
        setEmploymentStatus(isSelfEmployed ? "Self-employed" : "");
      }
    };

    checkEmploymentStatus();
  }, [alumniId, userType]);

  useEffect(() => {
    if (alumniData) {
      // Filter the data to get the record matching the alumniId
      const filteredData = alumniData.filter(
        (alumni: any) => alumni.id === alumniId
      );

      if (filteredData.length > 0) {
        const cleanedData = filteredData.map((alumni: any) => {
          const { meta_data, ...rest } = alumni;

          return {
            ...rest,
            ...meta_data,
          };
        });
        setCleanAlumniData(cleanedData[0] as AlumniData);

        // Identify which documents are available
        if (cleanedData[0]) {
          const userData = cleanedData[0];

          // Filter out COE if self-employed
          let available = documentFiles.filter((docType) => {
            if (
              docType === "Certificate of Employment" &&
              employmentStatus === "Self-employed"
            ) {
              return false;
            }

            const docKey = formatDocumentKey(docType);

            // Check if document exists in user metadata
            if (isMultipleDocumentType(docType)) {
              // For multiple documents like training certificates
              return (
                userData[docKey] &&
                Array.isArray(userData[docKey]) &&
                userData[docKey].length > 0
              );
            } else {
              // For single documents
              return userData[docKey] && userData[docKey].trim() !== "";
            }
          });

          // Add GTS only if viewerType is not agency
          if (viewerType !== "agency") {
            setAvailableDocuments([...available, "GTS"]);
          } else {
            // For agency viewers, only show document files
            setAvailableDocuments(available);
          }
        }
      }
    }
  }, [alumniData, alumniId, employmentStatus, userType, viewerType]);

  const handleOpenDocument = () => {
    if (!selectedDocumentType) return;

    if (selectedDocumentType === "GTS") {
      // Open GTS modal
      setOpenGPTSModal(true);
    } else {
      // Open document modal for other document types
      setIsDocumentModalOpen(true);
    }
  };

  const isDocumentAvailable = (docType: string) => {
    // GTS is only available for non-agency viewers
    if (docType === "GTS") return viewerType !== "agency";

    return availableDocuments.includes(docType);
  };

  return (
    <>
      <Modal
        size="xl"
        isOpen={openAlumniProfile}
        onOpenChange={setOpenAlumniProfile}
        onClose={() => {
          setAlumniId("");
          setUserType("");
          setOpenGPTSModal(false);
          setOpenAlumniProfile(false);
        }}
        className="overflow-hidden size-full lg:size-fit"
      >
        <ModalContent>
          {(onClose) => (
            <ModalContent className="h-full w-full overflow-hidden">
              <ModalHeader>Personal Details</ModalHeader>
              <ModalBody className="h-full w-full overflow-y-auto">
                <div className="h-full w-full overflow-y-auto ">
                  <div className="w-full flex flex-col lg:grid lg:grid-cols-3 items-center gap-4">
                    {/* Image field */}
                    <div className="col-span-1 flex justify-center">
                      <Avatar
                        src={cleanAlumniData?.profile_picture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    </div>
                    {userType === "agency" && (
                      <>
                        <Input
                          label="Company Name"
                          name="company_name"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.company_name}
                          readOnly
                        />
                        <Input
                          label="Company Type"
                          name="company_type"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.company_type}
                          readOnly
                        />
                      </>
                    )}
                    {userType === "alumni" && (
                      <>
                        <Input
                          label="Currenly Employed"
                          name="is_currently_employed"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.is_currently_employed?.toUpperCase()}
                          readOnly
                        />

                        <Input
                          label="Job Aligned with Course"
                          name="is_course_aligned_with_job"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.is_course_aligned_with_job?.toUpperCase()}
                          readOnly
                        />
                      </>
                    )}

                    <hr className="col-span-3" />
                    <Input
                      label="First Name"
                      name="first_name"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.first_name}
                      readOnly
                    />
                    <Input
                      label="Last Name"
                      name="last_name"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.last_name}
                      readOnly
                    />
                    <Input
                      label="Middle Name"
                      name="middle_name"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.middle_name}
                      readOnly
                    />

                    <Input
                      label="Contact Number"
                      name="contact_number"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.contact_number}
                      readOnly
                    />
                    <Input
                      label="Address"
                      name="address"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.address}
                      readOnly
                    />

                    {userType === "admin" && (
                      <Input
                        label="Gender"
                        name="gender"
                        color="success"
                        variant="bordered"
                        value={cleanAlumniData?.gender}
                        readOnly
                      />
                    )}

                    {userType === "agency" && (
                      <Input
                        label="Valid ID"
                        name="valid_id"
                        color="success"
                        variant="bordered"
                        value={cleanAlumniData?.valid_id}
                        readOnly
                      />
                    )}

                    {userType === "alumni" && (
                      <>
                        <Input
                          label="Birth Date"
                          name="birth_date"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.birth_date}
                          readOnly
                        />
                      </>
                    )}
                    {(userType === "alumni" || userType === "admin") && (
                      <Input
                        label="College"
                        color="success"
                        variant="bordered"
                        value={cleanAlumniData?.college?.toLocaleUpperCase()}
                        readOnly
                      />
                    )}

                    {userType === "alumni" && (
                      <>
                        <Input
                          label="Program"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.program?.toLocaleUpperCase()}
                          readOnly
                        />

                        <Input
                          label="Scholarship"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.scholarship?.toLocaleUpperCase()}
                          readOnly
                        />
                        <Input
                          label="Batch Year"
                          name="batch_year"
                          color="success"
                          variant="bordered"
                          value={cleanAlumniData?.batch_year}
                          readOnly
                        />
                      </>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between items-center gap-2">
                <div
                  className={`${
                    userType !== "alumni" &&
                    userType !== "agency" &&
                    "invisible"
                  } flex gap-2 items-center`}
                >
                  <div className="flex flex-col md:flex-row gap-2 items-center">
                    <Select
                      size="sm"
                      className="flex-grow uppercase min-w-[200px]"
                      label="Select Document"
                      placeholder="Choose a document to view"
                      defaultSelectedKeys={[]}
                      disabledKeys={allDocumentOptions.filter(
                        (doc) => !isDocumentAvailable(doc)
                      )}
                      value={selectedDocumentType || ""}
                      onChange={(e) => setSelectedDocumentType(e.target.value)}
                    >
                      {allDocumentOptions.map((doc) => (
                        <SelectItem key={doc} value={doc}>
                          {doc}
                        </SelectItem>
                      ))}
                    </Select>
                    <Button
                      color="success"
                      className="text-white md:w-24"
                      isDisabled={
                        !selectedDocumentType ||
                        !isDocumentAvailable(selectedDocumentType)
                      }
                      onClick={handleOpenDocument}
                    >
                      View
                    </Button>
                  </div>
                </div>
                <Button
                  color="secondary"
                  variant="flat"
                  onClick={() => {
                    setOpenAlumniProfile(false);
                  }}
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          )}
        </ModalContent>
      </Modal>

      {userType === "alumni" && viewerType !== "agency" && (
        <>
          <GTSComponent
            userInfo={cleanAlumniData}
            currentUserId={alumniId}
            openGPTSModal={openGPTSModal}
            setOpenGPTSModal={setOpenGPTSModal}
            isReadOnly={true}
            onEmploymentStatusChange={setEmploymentStatus}
          />

          <DocumentComponent
            userID={alumniId}
            isDocumentModalOpen={isDocumentModalOpen}
            setIsDocumentModalOpen={setIsDocumentModalOpen}
            reloadUser={() => {}}
            documentFile={null}
            setDocumentFile={() => {}}
            documentType={selectedDocumentType}
            isReadOnly={true}
            employmentStatus={employmentStatus}
          />
        </>
      )}

      {(userType === "alumni" || userType === "agency") && (
        <DocumentComponent
          userID={alumniId}
          isDocumentModalOpen={isDocumentModalOpen}
          setIsDocumentModalOpen={setIsDocumentModalOpen}
          reloadUser={() => {}}
          documentFile={null}
          setDocumentFile={() => {}}
          documentType={selectedDocumentType}
          isReadOnly={true}
          employmentStatus={employmentStatus}
        />
      )}
    </>
  );
};

export default AlumniProfileModal;
