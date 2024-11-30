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
import { deletePDSFile, insertPDSFiles } from "@/app/api/pdsIUD";
import { supabase } from "@/utils/supabase";

interface PDSComponentProps {
  userID: string;
  tempUserInfo: any;
  isPDSModalOpen: boolean;
  setIsPDSModalOpen: (isOpen: boolean) => void;
  reloadUser: () => void;
  PDSFile: File | null;
  setPDSFile: (file: File | null) => void;
  isReadOnly?: boolean;
}

const PDSComponent: React.FC<PDSComponentProps> = ({
  userID,
  tempUserInfo,
  isPDSModalOpen,
  setIsPDSModalOpen,
  reloadUser,
  PDSFile,
  setPDSFile,
  isReadOnly,
}) => {
  return (
    <Modal size="xl" isOpen={isPDSModalOpen} onOpenChange={setIsPDSModalOpen}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>PDS</ModalHeader>
            <ModalBody className="flex flex-col gap-2">
              {tempUserInfo.pds && (
                <>
                  <iframe
                    src={tempUserInfo.pds}
                    className="w-full h-96"
                    title="POE File"
                  />
                </>
              )}

              {!tempUserInfo.pds && (
                <div className="flex items-center gap-2">
                  <Input
                    fullWidth
                    size="sm"
                    color="success"
                    type="file"
                    label="PDS"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setPDSFile(e.target.files[0]);
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
                className={`${tempUserInfo.pds ? "block" : "hidden"}`}
                onClick={() => window.open(tempUserInfo.pds, "_blank")}
              >
                View
              </Button>
              <div className="flex gap-2">
                <Button
                  color="danger"
                  variant="flat"
                  className={`${
                    tempUserInfo.pds && !isReadOnly ? "block" : "hidden"
                  }`}
                  onClick={async () => {
                    await deletePDSFile(userID);

                    const { error } = await supabase.auth.updateUser({
                      data: {
                        pds: "",
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
                  isDisabled={!PDSFile}
                  className={`${(tempUserInfo.pds || isReadOnly) && "hidden"}`}
                  onClick={async () => {
                    let url: any = "";

                    if (tempUserInfo.pds) {
                      await deletePDSFile(userID);
                      url = await insertPDSFiles(userID, PDSFile);
                    } else {
                      url = await insertPDSFiles(userID, PDSFile);
                    }
                    const { error } = await supabase.auth.updateUser({
                      data: {
                        pds: url,
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
                    setIsPDSModalOpen(false);
                    setPDSFile(null);
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

export default PDSComponent;
