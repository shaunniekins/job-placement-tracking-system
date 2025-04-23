import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  Card,
  CardBody,
} from "@nextui-org/react";
import useOrganization from "@/hooks/useOrganization";
import { RootState } from "@/app/reduxUtils/store";
import {
  uploadOrgChartImage,
  deleteOrgChartImage,
} from "@/app/api/orgChartImageIUD";

const OrgChartComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userType, setUserType] = useState("");
  const { orgChartImageUrl, loadingOrgData } = useOrganization();
  const [modalOpen, setModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      if (
        user.user_metadata.user_type === "admin" ||
        user.user_metadata.user_type === "alumni" ||
        user.user_metadata.user_type === "agency"
      ) {
        setUserType(user.user_metadata.user_type);
      } else {
        setUserType("superadmin");
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;

    try {
      setIsUploading(true);
      // If there's an existing image, delete it first
      if (orgChartImageUrl) {
        await deleteOrgChartImage(orgChartImageUrl);
      }

      await uploadOrgChartImage(fileToUpload);
      setModalOpen(false);
      setFileToUpload(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceImage = () => {
    setFileToUpload(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  if (loadingOrgData) {
    return <div className="p-4 text-center">Loading organization chart...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4 p-4 md:p-8">
      <div className="w-full flex flex-col items-center justify-center">
        {!orgChartImageUrl ? (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg w-full max-w-2xl">
            <p className="text-gray-500 mb-4">
              No organization chart image uploaded yet.
            </p>
            {userType === "superadmin" && (
              <Button
                color="primary"
                variant="flat"
                onClick={() => setModalOpen(true)}
              >
                Upload Organization Chart
              </Button>
            )}
          </div>
        ) : (
          <Card className="w-full max-w-4xl">
            <CardBody className="flex flex-col items-center p-0">
              <img
                src={orgChartImageUrl}
                alt="Organization Chart"
                className="w-full h-auto object-contain"
              />
              {userType === "superadmin" && (
                <div className="p-4 flex justify-end w-full">
                  <Button
                    color="primary"
                    variant="flat"
                    onClick={handleReplaceImage}
                  >
                    Replace Image
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        size="lg"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {orgChartImageUrl
                  ? "Replace Organization Chart"
                  : "Upload Organization Chart"}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  {previewUrl ? (
                    <div className="mb-4 max-w-full max-h-[400px] overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-[400px] object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">
                      Select an image file for the organization chart
                    </p>
                  )}

                  <label className="cursor-pointer bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors">
                    {previewUrl ? "Choose Another Image" : "Choose Image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={!fileToUpload || isUploading}
                  isLoading={isUploading}
                  onPress={handleUpload}
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OrgChartComponent;
