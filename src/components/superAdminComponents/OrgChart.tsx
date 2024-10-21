import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Modal,
  Input,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
} from "@nextui-org/react";
import useOrganization from "@/hooks/useOrganization";
import { RootState } from "@/app/reduxUtils/store";
import {
  insertOrgData,
  updateOrgData,
  deleteOrgData,
} from "@/app/api/orgDataIUD";

interface Node {
  id: string;
  label: string;
  name?: string;
  parent_id?: string;
  children?: Node[];
}

const OrgChartComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userType, setUserType] = useState("");
  const { orgData, loadingOrgData } = useOrganization();
  const [data, setData] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newName, setNewName] = useState("");
  const [isEditMode, setIsEditMode] = useState(false); // New state to track mode

  useEffect(() => {
    if (user & user.user_metadata) {
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

  useEffect(() => {
    if (orgData) {
      const transformedData = transformOrgData(orgData);
      setData(transformedData);
    }
  }, [orgData]);

  const transformOrgData = (data: any[]): Node[] => {
    const nodeMap = new Map<string, Node>();
    data.forEach((item) => {
      nodeMap.set(item.id, {
        id: item.id,
        label: item.position,
        name: item.name,
        parent_id: item.parent_id,
        children: [],
      });
    });

    const rootNodes: Node[] = [];
    nodeMap.forEach((node) => {
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const addNode = async (parent: Node | null) => {
    const newNode = {
      position: newLabel,
      name: newName,
      parent_id: parent ? parent.id : null,
    };
    const result = await insertOrgData(newNode);
    if (result) {
      setModalOpen(false);
      setNewLabel("");
      setNewName("");
    }
  };

  const editNode = async (node: Node) => {
    const updatedNode = {
      position: newLabel,
      name: newName,
    };
    const result = await updateOrgData(parseInt(node.id), updatedNode);
    if (result) {
      setModalOpen(false);
      setNewLabel("");
      setNewName("");
    }
  };

  const deleteNode = async (nodeToDelete: Node) => {
    await deleteOrgData(parseInt(nodeToDelete.id));
  };

  const renderNode = (node: Node) => (
    <div key={node.id} className="text-center">
      <div className="flex flex-col items-center">
        <div className="border border-green-500 p-2 rounded-xl bg-green-100">
          <span>{node.label}</span>
          {node.name && (
            <div className="text-sm text-gray-500">({node.name})</div>
          )}
          <div className="flex space-x-2 mt-2">
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onClick={() => {
                setSelectedNode(node);
                setNewLabel(node.label);
                setNewName(node.name || "");
                setIsEditMode(true); // Set to edit mode
                setModalOpen(true);
              }}
              className={userType !== "superadmin" ? "invisible" : ""}
            >
              Edit
            </Button>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onClick={() => {
                setSelectedNode(node);
                setNewLabel("");
                setNewName("");
                setIsEditMode(false);
                setModalOpen(true);
              }}
              className={userType !== "superadmin" ? "invisible" : ""}
            >
              Add
            </Button>
            {node.parent_id && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onClick={() => deleteNode(node)}
                className={userType !== "superadmin" ? "invisible" : ""}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex justify-center mt-4">
          {node.children.map((child, index) => (
            <div
              key={child.id}
              className={`${
                index === 0 ? "mr-4" : "ml-4"
              } flex flex-col items-center`}
            >
              <div className="w-px h-8 bg-gray-400" />
              <div className="flex items-center justify-center">
                {renderNode(child)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loadingOrgData) {
    return <div>Loading organization data...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="flex h-full w-full overflow-y-auto relative mb-24">
        {data.length === 0 && (
          <div className="h-full w-full flex justify-center items-center -mt-16">
            <p>No nodes yet.</p>
          </div>
        )}

        {data.length > 0 && (
          <div className="h-full w-full flex justify-center px-96">
            {data.map((node) => renderNode(node))}
          </div>
        )}
      </div>
      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{isEditMode ? "Edit Node" : "Add Node"}</ModalHeader>
              <ModalBody>
                <Input
                  fullWidth
                  label="Position"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
                <Input
                  fullWidth
                  label="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-2"
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="warning"
                  variant="flat"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="flat"
                  onClick={() =>
                    isEditMode && selectedNode
                      ? editNode(selectedNode)
                      : addNode(selectedNode)
                  }
                >
                  {isEditMode ? "Save" : "Add"}
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
