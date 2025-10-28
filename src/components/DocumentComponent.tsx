"use client";

import React, { useEffect, useState } from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Card,
  CardBody,
  CardFooter,
} from "@nextui-org/react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase";
import { getUserInfo } from "@/app/api/users";
import { formatDocumentKey, isMultipleDocumentType } from "@/utils/compUtils";
import { MdDelete } from "react-icons/md";
import { IoIosEye } from "react-icons/io";
import { isUserSelfEmployed } from "@/utils/documentUtils";

interface DocumentComponentProps {
  userID: string;
  isDocumentModalOpen: boolean;
  setIsDocumentModalOpen: (isOpen: boolean) => void;
  reloadUser: () => void;
  documentFile: File | null;
  setDocumentFile: (file: File | null) => void;
  documentType: string;
  isReadOnly?: boolean;
  employmentStatus?: string;
}

const DocumentComponent: React.FC<DocumentComponentProps> = ({
  userID,
  isDocumentModalOpen,
  setIsDocumentModalOpen,
  reloadUser,
  documentFile,
  setDocumentFile,
  documentType,
  isReadOnly,
  employmentStatus,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [formattedDocType, setFormattedDocType] = useState("");
  const [selectedDocumentUrl, setSelectedDocumentUrl] = useState<string | null>(
    null
  );
  const [certificateTitle, setCertificateTitle] = useState("");
  const [isSelfEmployed, setIsSelfEmployed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // Add check for valid userID
      if (!userID || typeof userID !== "string" || userID.trim() === "") {
        console.warn(
          "fetchUser called with invalid userID in DocumentComponent. Skipping fetch."
        );
        setUserData({}); // Reset user data if ID is invalid
        return;
      }
      try {
        const userData1 = await getUserInfo(userID);
        // Add null check for userData1 before accessing meta_data
        if (userData1 && userData1.meta_data) {
          setUserData(userData1.meta_data);

          // Check if the user is self-employed from GTS
          if (documentType === "Certificate of Employment") {
            const selfEmployed = await isUserSelfEmployed(userID);
            setIsSelfEmployed(selfEmployed);
          }
        } else {
          // Handle case where getUserInfo returns null or meta_data is missing
          console.error(
            "Failed to fetch valid user data or meta_data missing for userID:",
            userID
          );
          setUserData({}); // Reset or set to a default state
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({}); // Reset user data on error
      }
    };

    // Format the document type to match the key in metadata
    const formattedKey = formatDocumentKey(documentType);
    setFormattedDocType(formattedKey);
    fetchUser();
  }, [userID, documentType]);

  // Also update based on employmentStatus prop if provided
  useEffect(() => {
    if (employmentStatus === "Self-employed") {
      setIsSelfEmployed(true);
    } else if (employmentStatus) {
      setIsSelfEmployed(false);
    }
  }, [employmentStatus]);

  // For clear feedback to the user if COE is not applicable
  useEffect(() => {
    if (
      isDocumentModalOpen &&
      documentType === "Certificate of Employment" &&
      isSelfEmployed
    ) {
      toast.info(
        "Certificate of Employment is not required for self-employed individuals."
      );
      setIsDocumentModalOpen(false);
    }
  }, [
    isDocumentModalOpen,
    documentType,
    isSelfEmployed,
    setIsDocumentModalOpen,
  ]);

  const handleFileUpload = async () => {
    if (!documentFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // For training certificates, require a title
    if (isMultipleDocumentType(documentType) && !certificateTitle.trim()) {
      toast.error("Please provide a title for the certificate");
      return;
    }

    setIsUploading(true);

    try {
      const formattedDocType = formatDocumentKey(documentType);

      // Get current date for filename
      const now = new Date();
      const datetime = now.toISOString().replace(/[:.]/g, "-");

      // Create filename: datetime-userId-document-type.pdf
      let fileName = `${datetime}-${userID}-${formattedDocType}.pdf`;

      // For training certificates, include the title in the filename
      if (isMultipleDocumentType(documentType)) {
        const titleSlug = certificateTitle.toLowerCase().replace(/\s+/g, "-");
        fileName = `${datetime}-${userID}-${titleSlug}-training-cert.pdf`;
      }

      // Create path: documents/documentType/filename
      const filePath = `${documentType}/${fileName}`;

      // Upload file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, documentFile);

      if (uploadError) {
        console.error("Failed to upload document:", uploadError);
        throw new Error("File upload failed");
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData.publicUrl;

      // For training certificates, append to the array with metadata
      if (isMultipleDocumentType(documentType)) {
        const certificateData = {
          url: fileUrl,
          title: certificateTitle,
          uploadDate: new Date().toISOString(),
        };

        const currentCerts = userData[formattedDocType] || [];
        const updatedCerts = Array.isArray(currentCerts)
          ? [...currentCerts, certificateData]
          : [certificateData];

        const { error } = await supabase.auth.updateUser({
          data: {
            [formattedDocType]: updatedCerts,
          },
        });

        if (error) throw error;
      } else {
        // Regular document handling
        const { error } = await supabase.auth.updateUser({
          data: {
            [formattedDocType]: fileUrl,
          },
        });

        if (error) throw error;
      }

      toast.success("Document uploaded successfully");
      setCertificateTitle("");
      setDocumentFile(null);

      // Only close modal for non-training certificates
      if (!isMultipleDocumentType(documentType)) {
        setIsDocumentModalOpen(false);
      }
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      // Call fetchUser directly since it's now defined inline
      const fetchUser = async () => {
        if (!userID || typeof userID !== "string" || userID.trim() === "") {
          setUserData({});
          return;
        }
        try {
          const userData1 = await getUserInfo(userID);
          if (userData1 && userData1.meta_data) {
            setUserData(userData1.meta_data);
            if (documentType === "Certificate of Employment") {
              const selfEmployed = await isUserSelfEmployed(userID);
              setIsSelfEmployed(selfEmployed);
            }
          } else {
            setUserData({});
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({});
        }
      };
      fetchUser();
      reloadUser();
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (urlToDelete?: string) => {
    const docUrl = urlToDelete || userData[formattedDocType];

    if (!docUrl) {
      toast.error("No document to delete");
      return;
    }

    setIsDeleting(true);

    try {
      let url;
      let certificateIndex;

      // Handle training certificates differently
      if (isMultipleDocumentType(documentType)) {
        if (!urlToDelete) {
          toast.error("No specific certificate selected for deletion");
          return;
        }

        // Find the certificate to delete
        url = urlToDelete;
        certificateIndex = userData[formattedDocType]?.findIndex(
          (cert: any) => cert.url === urlToDelete
        );

        if (certificateIndex === -1) {
          throw new Error("Certificate not found");
        }
      } else {
        url = docUrl;
      }

      // Extract the file path from the URL
      const urlParts = url.split("/public/documents/");

      if (urlParts.length !== 2) {
        throw new Error("Invalid document URL format");
      }

      const filePath = urlParts[1];

      // Delete the file from Supabase storage
      const { error: deleteError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (deleteError) {
        throw new Error("Failed to delete document from storage");
      }

      // Update user metadata
      if (isMultipleDocumentType(documentType)) {
        // Remove the specific certificate from the array
        const updatedCerts = [...userData[formattedDocType]];
        updatedCerts.splice(certificateIndex, 1);

        const { error } = await supabase.auth.updateUser({
          data: {
            [formattedDocType]: updatedCerts,
          },
        });

        if (error) throw error;

        toast.success("Certificate deleted successfully");
      } else {
        // For regular documents, simply clear the field
        const { error } = await supabase.auth.updateUser({
          data: {
            [formattedDocType]: "",
          },
        });

        if (error) throw error;

        toast.success("Document deleted successfully");
      }

      // Call fetchUser directly since it's now defined inline
      const fetchUser = async () => {
        if (!userID || typeof userID !== "string" || userID.trim() === "") {
          setUserData({});
          return;
        }
        try {
          const userData1 = await getUserInfo(userID);
          if (userData1 && userData1.meta_data) {
            setUserData(userData1.meta_data);
            if (documentType === "Certificate of Employment") {
              const selfEmployed = await isUserSelfEmployed(userID);
              setIsSelfEmployed(selfEmployed);
            }
          } else {
            setUserData({});
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({});
        }
      };
      fetchUser();
      reloadUser();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setSelectedDocumentUrl(null);
    }
  };

  return (
    <>
      {documentType === "Certificate of Employment" && isSelfEmployed ? (
        // Return empty fragment if COE is not applicable
        <></>
      ) : (
        <Modal
          isOpen={isDocumentModalOpen}
          onOpenChange={(isOpen) => {
            // Prevent event propagation when closing this modal
            setIsDocumentModalOpen(isOpen);
          }}
          isDismissable={true}
          isKeyboardDismissDisabled={false}
        >
          <ModalContent onClick={(e) => e.stopPropagation()}>
            {(onClose) => (
              <>
                <ModalHeader>{documentType}</ModalHeader>
                <ModalBody className="flex flex-col gap-4">
                  {isMultipleDocumentType(documentType) ? (
                    // Display for certificates of training
                    <>
                      {/* Selected certificate preview */}
                      {selectedDocumentUrl && (
                        <div className="mb-4">
                          <iframe
                            src={selectedDocumentUrl}
                            className="w-full h-[80rem]"
                            title="Selected Certificate"
                          />
                          <div className="flex justify-end mt-2 gap-2">
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() =>
                                window.open(selectedDocumentUrl, "_blank")
                              }
                            >
                              View Full Screen
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              isDisabled={isDeleting || isReadOnly}
                              onClick={() =>
                                handleDeleteDocument(selectedDocumentUrl)
                              }
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                            <Button
                              color="default"
                              size="sm"
                              onClick={() => setSelectedDocumentUrl(null)}
                            >
                              Close Preview
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* List of certificates */}
                      {!selectedDocumentUrl &&
                        Array.isArray(userData[formattedDocType]) &&
                        userData[formattedDocType].length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {userData[formattedDocType].map(
                              (cert: any, index: number) => (
                                <Card key={index} className="max-w-full">
                                  <CardBody className="overflow-hidden">
                                    <p className="font-semibold text-md">
                                      {cert.title || `Certificate ${index + 1}`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {cert.uploadDate
                                        ? new Date(
                                            cert.uploadDate
                                          ).toLocaleDateString()
                                        : "No date"}
                                    </p>
                                  </CardBody>
                                  <CardFooter className="flex justify-end gap-2">
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      color="primary"
                                      onClick={() =>
                                        setSelectedDocumentUrl(cert.url)
                                      }
                                    >
                                      <IoIosEye />
                                    </Button>
                                    {!isReadOnly && (
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        onClick={() =>
                                          handleDeleteDocument(cert.url)
                                        }
                                      >
                                        <MdDelete />
                                      </Button>
                                    )}
                                  </CardFooter>
                                </Card>
                              )
                            )}
                          </div>
                        )}

                      {/* Upload form for new certificate */}
                      {!selectedDocumentUrl && !isReadOnly && (
                        <div className="border p-4 rounded-lg mt-4">
                          <h3 className="text-md font-semibold mb-3">
                            Upload New Certificate
                          </h3>
                          <div className="flex flex-col gap-3">
                            <Input
                              fullWidth
                              size="sm"
                              color="success"
                              label="Certificate Title"
                              placeholder="e.g. Web Development Workshop"
                              value={certificateTitle}
                              onChange={(e) =>
                                setCertificateTitle(e.target.value)
                              }
                              isRequired
                            />
                            <Input
                              fullWidth
                              size="sm"
                              color="success"
                              type="file"
                              accept="application/pdf"
                              label="Certificate File"
                              isReadOnly={isUploading}
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  setDocumentFile(e.target.files[0]);
                                }
                              }}
                            />
                            <Button
                              color="primary"
                              size="sm"
                              className="mt-2"
                              isDisabled={
                                !documentFile ||
                                !certificateTitle.trim() ||
                                isUploading
                              }
                              onClick={handleFileUpload}
                            >
                              {isUploading
                                ? "Uploading..."
                                : "Upload Certificate"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {!selectedDocumentUrl &&
                        (!userData[formattedDocType] ||
                          userData[formattedDocType].length === 0) && (
                          <div className="text-center py-8">
                            <p className="text-gray-500">
                              No certificates uploaded yet
                            </p>
                          </div>
                        )}
                    </>
                  ) : (
                    // Standard single document display
                    <>
                      {userData[formattedDocType] && (
                        <iframe
                          src={userData[formattedDocType]}
                          className="w-full h-96"
                          title={`${documentType} File`}
                        />
                      )}

                      {!userData[formattedDocType] && !isReadOnly && (
                        <div className="flex items-center gap-2">
                          <Input
                            fullWidth
                            size="sm"
                            color="success"
                            type="file"
                            accept="application/pdf"
                            label={documentType}
                            isReadOnly={isUploading}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setDocumentFile(e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </ModalBody>
                <ModalFooter className="flex justify-between gap-2">
                  {!isMultipleDocumentType(documentType) && (
                    <>
                      <Button
                        color="secondary"
                        variant="flat"
                        className={`${
                          userData[formattedDocType] ? "block" : "hidden"
                        }
                    invisible  
                    `}
                        onClick={() =>
                          window.open(userData[formattedDocType], "_blank")
                        }
                      >
                        View
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          color="danger"
                          variant="flat"
                          className={`${
                            userData[formattedDocType] && !isReadOnly
                              ? "block"
                              : "hidden"
                          }`}
                          isDisabled={isDeleting}
                          onClick={() => handleDeleteDocument()}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>

                        <Button
                          color="primary"
                          variant="flat"
                          isDisabled={!documentFile || isUploading}
                          className={`${
                            (userData[formattedDocType] || isReadOnly) &&
                            "hidden"
                          }`}
                          onClick={handleFileUpload}
                        >
                          Add
                        </Button>
                        <Button
                          color="warning"
                          variant="flat"
                          onClick={() => {
                            setIsDocumentModalOpen(false);
                            setDocumentFile(null);
                            setSelectedDocumentUrl(null);
                            setCertificateTitle("");
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                  {isMultipleDocumentType(documentType) && (
                    <div className="flex justify-end w-full">
                      <Button
                        color="warning"
                        variant="flat"
                        onClick={() => {
                          setIsDocumentModalOpen(false);
                          setDocumentFile(null);
                          setSelectedDocumentUrl(null);
                          setCertificateTitle("");
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default DocumentComponent;
