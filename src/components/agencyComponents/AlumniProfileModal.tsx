"use client";

import useAlumni from "@/hooks/useAlumni";
import useGTS from "@/hooks/useGTS";
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import GTSComponent from "../GTS";
import { useEffect, useState } from "react";
import POEComponent from "../POEComponent";

interface AlumniProfileModalProps {
  alumniId: string;
  openAlumniProfile: boolean;
  setOpenAlumniProfile: (isOpen: boolean) => void;
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
  openAlumniProfile,
  setOpenAlumniProfile,
}) => {
  const { gts, loadingGTS, errorGTS } = useGTS(alumniId);
  const { alumniData, isLoadingAlumni, totalAlumniEntries } =
    useAlumni(alumniId);

  const [openGPTSModal, setOpenGPTSModal] = useState(false);
  const [cleanAlumniData, setCleanAlumniData] = useState<AlumniData | null>(
    null
  );
  const [openPOEModal, setOpenPOEModal] = useState(false);

  useEffect(() => {
    if (alumniData) {
      const cleanedData = alumniData.map((alumni: any) => {
        const { meta_data, ...rest } = alumni;

        return {
          ...rest,
          ...meta_data,
        };
      });

      setCleanAlumniData(cleanedData[0] as AlumniData);
    }
  }, [alumniData]);

  return (
    <>
      <Modal
        size="2xl"
        isOpen={openAlumniProfile}
        onOpenChange={setOpenAlumniProfile}
        className="overflow-hidden"
      >
        <ModalContent>
          {(onClose) => (
            <ModalContent className="h-full w-full ">
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
                    <Input
                      label="Currenly Employed"
                      name="is_currently_employed"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.is_currently_employed.toUpperCase()}
                      readOnly
                    />

                    <Input
                      label="Job Aligned with Course"
                      name="is_course_aligned_with_job"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.is_course_aligned_with_job.toUpperCase()}
                      readOnly
                    />

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

                    <Input
                      label="Birth Date"
                      name="birth_date"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.birth_date}
                      readOnly
                    />

                    <Input
                      label="College"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.college.toLocaleUpperCase()}
                      readOnly
                    />

                    <Input
                      label="Program"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.program.toLocaleUpperCase()}
                      readOnly
                    />

                    <Input
                      label="Scholarship"
                      color="success"
                      variant="bordered"
                      value={cleanAlumniData?.scholarship.toLocaleUpperCase()}
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
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    color="success"
                    className="text-white"
                    onClick={() => setOpenPOEModal(true)}
                  >
                    POE
                  </Button>
                  <Button
                    color="success"
                    className="text-white"
                    onClick={() => setOpenGPTSModal(true)}
                  >
                    GTS
                  </Button>
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

      <GTSComponent
        userInfo={cleanAlumniData}
        currentUserId={alumniId}
        openGPTSModal={openGPTSModal}
        setOpenGPTSModal={setOpenGPTSModal}
        isReadOnly={true}
      />
      <POEComponent
        userID={alumniId}
        tempUserInfo={cleanAlumniData}
        isPOEModalOpen={openPOEModal}
        setIsPOEModalOpen={setOpenPOEModal}
        reloadUser={() => {}}
        POEFile={null}
        setPOEFile={() => {}}
        isReadOnly={true}
      />
    </>
  );
};

export default AlumniProfileModal;
