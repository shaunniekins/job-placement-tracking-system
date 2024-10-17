"use client";

import React from "react";
import {
  Input,
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "@nextui-org/react";
import { deletePOEFile, insertPOEFile } from "@/app/api/poeIUD";
import { supabase } from "@/utils/supabase";

interface POEComponentProps {
  userID: string;
  tempUserInfo: any;
  isPOEModalOpen: boolean;
  setIsPOEModalOpen: (isOpen: boolean) => void;
  reloadUser: () => void;
  POEFile: File | null;
  setPOEFile: (file: File | null) => void;
  isReadOnly?: boolean;
}

const POEComponent: React.FC<POEComponentProps> = ({
  userID,
  tempUserInfo,
  isPOEModalOpen,
  setIsPOEModalOpen,
  reloadUser,
  POEFile,
  setPOEFile,
  isReadOnly,
}) => {
  return (
    <Modal size="xl" isOpen={isPOEModalOpen} onOpenChange={setIsPOEModalOpen}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Profile of Employment</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              {tempUserInfo.profile_of_employment && (
                <>
                  <iframe
                    src={tempUserInfo.profile_of_employment}
                    className="w-full h-96"
                    title="POE File"
                  />
                </>
              )}

              {!tempUserInfo.profile_of_employment && (
                <div className="flex items-center gap-2">
                  <Input
                    fullWidth
                    size="sm"
                    color="success"
                    type="file"
                    label="Profile of Employment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPOEFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}
            </ModalBody>
            <ModalFooter className="flex justify-between gap-2">
              <Button
                color="secondary"
                variant="flat"
                className={`${
                  tempUserInfo.profile_of_employment ? "block" : "hidden"
                }`}
                onClick={() =>
                  window.open(tempUserInfo.profile_of_employment, "_blank")
                }
              >
                View
              </Button>
              <div className="flex gap-2">
                <Button
                  color="danger"
                  variant="flat"
                  className={`${
                    tempUserInfo.profile_of_employment && !isReadOnly
                      ? "block"
                      : "hidden"
                  }`}
                  onClick={async () => {
                    await deletePOEFile(userID);

                    const { error } = await supabase.auth.updateUser({
                      data: {
                        profile_of_employment: "",
                      },
                    });
                    if (error) throw error;

                    reloadUser();
                  }}
                >
                  Delete
                </Button>

                <Button
                  color="primary"
                  variant="flat"
                  isDisabled={!POEFile}
                  className={`${
                    (tempUserInfo.profile_of_employment || isReadOnly) &&
                    "hidden"
                  }`}
                  onClick={async () => {
                    let url: any = "";

                    if (tempUserInfo.profile_of_employment) {
                      await deletePOEFile(userID);
                      url = await insertPOEFile(userID, POEFile);
                    } else {
                      url = await insertPOEFile(userID, POEFile);
                    }
                    const { error } = await supabase.auth.updateUser({
                      data: {
                        profile_of_employment: url,
                      },
                    });
                    if (error) throw error;

                    reloadUser();
                  }}
                >
                  Add
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => {
                    setIsPOEModalOpen(false);
                    setPOEFile(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default POEComponent;
