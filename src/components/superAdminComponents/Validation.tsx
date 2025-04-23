"use client";

import { Key, useEffect, useState } from "react";
import {
  Button,
  Pagination,
  Spinner,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumn,
  TableCell,
  SelectItem,
  Select,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Badge,
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import useJobPostings from "@/hooks/useJobPostings";
import { supabaseAdmin } from "@/utils/supabase";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { deleteJobPosting, updateJobPosting } from "@/app/api/jobPostingsIUD";
import { MdDelete } from "react-icons/md";
import {
  formatDate,
  formatDateYearFirst,
  sendEmailNotification,
} from "@/utils/compUtils";
import { insertNotification } from "@/app/api/notificationsIUD";
import { useValidationBadge } from "@/contexts/ValidationBadgeContext";

const ValidationComponent = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const [currentView, setCurrentView] = useState("agency");
  const [currenViewContent, setCurrentViewContent] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [totalPages, setTotalPages] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentJobPostingId, setCurrentJobPostingId] = useState("");

  const { agencyCount, alumniCount, jpCount, refetchCounts } =
    useValidationBadge();

  const handleTabSelectionChange = (key: Key) => {
    const keyString = key.toString();
    if (keyString !== currentView) {
      setCurrentView(keyString);
      setPage(1);
      setStatusFilter("pending");
    }
  };

  const {
    usersData,
    totalUserEntries,
    isLoadingUsers,
    fetchAndSubscribeUsers,
  } = useUsers(rowsPerPage, page, currentView, statusFilter);

  const {
    jobPostings,
    totalJobPostings,
    loadingJobPostings,
    fetchJobPostings,
  } = useJobPostings(rowsPerPage, page, undefined, statusFilter);

  const agencyColumns = [
    { key: "company_name", label: "Company Name" },
    { key: "company_type", label: "Company Type" },
    { key: "moa_file", label: "MOA" },
    { key: "moa_duration", label: "Duration of MOA" },
    { key: "contact_number", label: "Contact Number" },
    { key: "action", label: "Action" },
  ];

  const alumniColumns = [
    { key: "name", label: "Name" },
    { key: "college", label: "College" },
    { key: "program", label: "Program" },
    { key: "batch_year", label: "Batch Year" },
    { key: "action", label: "Action" },
  ];

  const jobPostingColumns = [
    { key: "job_title", label: "Job Title" },
    { key: "job_type", label: "Job Type" },
    { key: "industry", label: "Industry" },
    { key: "application_deadline", label: "Deadline" },
    { key: "action", label: "Action" },
  ];

  const [currentColumns, setCurrentColumns] = useState(agencyColumns);

  useEffect(() => {
    setPage(1);
    setCurrentColumns([]);
    setCurrentViewContent([]);
    setTotalPages(0);

    if (currentView === "agency") {
      setCurrentColumns(agencyColumns);
      setCurrentViewContent(usersData);
      setTotalPages(Math.ceil(totalUserEntries / rowsPerPage));
    } else if (currentView === "alumni") {
      setCurrentColumns(alumniColumns);
      setCurrentViewContent(usersData);
      setTotalPages(Math.ceil(totalUserEntries / rowsPerPage));
    } else if (currentView === "job_postings") {
      setCurrentColumns(jobPostingColumns);
      setCurrentViewContent(jobPostings);
      setTotalPages(Math.ceil(totalJobPostings / rowsPerPage));
    }
  }, [currentView, usersData, jobPostings, totalUserEntries, totalJobPostings]);

  if (isLoadingUsers || loadingJobPostings) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  const handleAction = async (
    itemId: string,
    itemEmail: string,
    action: string,
    itemData: any
  ) => {
    let success = false;
    if (currentView === "agency" || currentView === "alumni") {
      try {
        const { data: user, error } =
          await supabaseAdmin.auth.admin.updateUserById(itemId, {
            user_metadata: { account_status: action },
          });
        if (error) throw error;
        success = true;

        if (action === "approved" && user) {
          const sendEmailData = {
            email: itemEmail,
            recipient_name: `${itemData.first_name} ${itemData.last_name}`,
            subject: "Account Approved",
            message: `
Greetings!

We are pleased to inform you that your account associated with the email ${itemData.email} has been approved. You can now sign in and access your account. Thank you!

Best regards,
JPTS Team`,
          };
          await sendEmailNotification(sendEmailData);
          await insertNotification({
            receiver_id: itemId,
            message: `Your account has been approved.`,
          });
        }
        fetchAndSubscribeUsers();
      } catch (error) {
        console.error("Error updating user:", error);
        success = false;
      }
    } else if (currentView === "job_postings") {
      try {
        const jobId = parseInt(itemId, 10);
        const job = await updateJobPosting(jobId, {
          job_status: action,
        });
        if (!job) throw new Error("Failed to update job posting");
        success = true;

        const sendEmailData = {
          email: itemEmail,
          recipient_name: itemData.agency_name,
          subject: "Job Posting Status Update",
          message: `
Greetings!

We would like to inform you that the job posting status for "${itemData.job_title}" has been updated to ${action}.
Thank you!

Best regards,
JPTS Team`,
        };
        await sendEmailNotification(sendEmailData);
        await insertNotification({
          receiver_id: itemData.agency_id,
          message: `Your job posting "${itemData.job_title}" status has been updated to ${action}.`,
        });
        fetchJobPostings();
      } catch (error) {
        console.error("Error updating job posting:", error);
        success = false;
      }
    }

    if (success) {
      refetchCounts();
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <Modal
        size="md"
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onClose={() => {
          setCurrentJobPostingId("");
          setDeleteModalOpen(false);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Delete Confirmation</ModalHeader>
              <ModalBody>
                <h1>Are you sure you want to delete this job posting?</h1>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-2">
                <Button
                  variant="flat"
                  onClick={() => {
                    setDeleteModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  onClick={async () => {
                    if (!currentJobPostingId) return;

                    const response = await deleteJobPosting(
                      currentJobPostingId
                    );
                    response && fetchJobPostings();
                  }}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex gap-3">
          <Tabs
            aria-label="Tab Options"
            selectedKey={currentView}
            color="success"
            size="lg"
            fullWidth={true}
            variant="underlined"
            onSelectionChange={handleTabSelectionChange}
          >
            <Tab
              key="agency"
              title={
                <div className="flex items-center space-x-2">
                  <Badge
                    isOneChar
                    isInvisible={agencyCount === 0}
                    size="sm"
                    color="danger"
                    shape="circle"
                    placement="top-right"
                  >
                    <span>Agency</span>
                  </Badge>
                </div>
              }
            />
            <Tab
              key="alumni"
              title={
                <div className="flex items-center space-x-2">
                  <Badge
                    isOneChar
                    isInvisible={alumniCount === 0}
                    size="sm"
                    color="danger"
                    shape="circle"
                    placement="top-right"
                  >
                    <span>Graduates</span>
                  </Badge>
                </div>
              }
            />
            <Tab
              key="job_postings"
              title={
                <div className="flex items-center space-x-2">
                  <Badge
                    isOneChar
                    isInvisible={jpCount === 0}
                    size="sm"
                    color="danger"
                    shape="circle"
                    placement="top-right"
                  >
                    <span>Job Applications</span>
                  </Badge>
                </div>
              }
            />
          </Tabs>
        </div>
        <div className="w-full flex items-center justify-center lg:justify-end gap-3">
          <Select
            label="Status Filter"
            disallowEmptySelection={true}
            size="sm"
            className="max-w-32"
            defaultSelectedKeys={["pending"]}
            selectedKeys={new Set([statusFilter])}
            onSelectionChange={(keys) => {
              if (keys !== "all" && keys instanceof Set) {
                const selectedKey = Array.from(keys)[0];
                if (typeof selectedKey === "string") {
                  setStatusFilter(selectedKey);
                }
              }
            }}
          >
            <SelectItem key={"pending"}>Pending</SelectItem>
            <SelectItem key={"approved"}>Approved</SelectItem>
            <SelectItem key={"declined"}>Declined</SelectItem>
          </Select>

          <Pagination
            isCompact
            showControls
            showShadow
            color="default"
            page={page}
            total={totalPages}
            onChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>
      <div className="flex h-full w-full overflow-y-auto relative">
        <Table
          fullWidth
          layout="auto"
          isHeaderSticky={true}
          aria-label="Job Applications Table"
          classNames={{
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={currentColumns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className={`${column.key === "seen" && "lg:w-36"}
                     ${column.key === "message" && "w-32 lg:w-auto"} 
                    bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap`}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={currenViewContent}
            emptyContent={"No data to display."}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow
                key={item.id ? item.id : item.job_posting_id}
                className="text-center hover:bg-green-100"
              >
                {(columnKey) => {
                  if (currentView === "agency") {
                    if (columnKey === "company_name") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.company_name}
                        </TableCell>
                      );
                    }

                    if (columnKey === "company_type") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.company_type}
                        </TableCell>
                      );
                    }

                    if (columnKey === "moa_file") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.moa_file ? (
                            <a
                              href={item.meta_data.moa_file}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 underline cursor-pointer"
                            >
                              View MOA
                            </a>
                          ) : (
                            <span>N/A</span>
                          )}
                        </TableCell>
                      );
                    }

                    if (columnKey === "moa_duration") {
                      return (
                        <TableCell className="text-center">
                          {formatDateYearFirst(item.meta_data.moa_year_start)} -{" "}
                          {formatDateYearFirst(item.meta_data.moa_year_end)}
                        </TableCell>
                      );
                    }

                    if (columnKey === "contact_number") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.contact_number}
                        </TableCell>
                      );
                    }
                  }

                  if (currentView === "alumni") {
                    if (columnKey === "name") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.first_name} {item.meta_data.last_name}
                        </TableCell>
                      );
                    }

                    if (columnKey === "college") {
                      return (
                        <TableCell className="text-center uppercase">
                          {item.meta_data.college}
                        </TableCell>
                      );
                    }

                    if (columnKey === "program") {
                      return (
                        <TableCell className="text-center uppercase">
                          {item.meta_data.program}
                        </TableCell>
                      );
                    }

                    if (columnKey === "batch_year") {
                      return (
                        <TableCell className="text-center">
                          {item.meta_data.batch_year}
                        </TableCell>
                      );
                    }
                  }

                  if (columnKey === "action") {
                    const itemId =
                      currentView === "job_postings"
                        ? item.job_posting_id
                        : item.id;
                    const itemEmail =
                      currentView === "job_postings"
                        ? item.agency_email
                        : item.email;
                    const itemData =
                      currentView === "job_postings" ? item : item.meta_data;
                    const itemStatus =
                      currentView === "job_postings"
                        ? item.job_status
                        : item.meta_data.account_status;

                    return (
                      <TableCell className="flex items-center justify-center gap-4">
                        {itemStatus === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              onClick={() =>
                                handleAction(
                                  itemId,
                                  itemEmail,
                                  "approved",
                                  itemData
                                )
                              }
                            >
                              <IoMdCheckmark />
                            </Button>
                            <Button
                              size="sm"
                              isIconOnly
                              color="warning"
                              onClick={() =>
                                handleAction(
                                  itemId,
                                  itemEmail,
                                  "declined",
                                  itemData
                                )
                              }
                            >
                              <IoMdClose />
                            </Button>
                          </>
                        ) : itemStatus === "approved" ? (
                          <>
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isDisabled={true}
                            >
                              <IoMdCheckmark />
                            </Button>
                            {currentView === "job_postings" && (
                              <Button
                                size="sm"
                                isIconOnly
                                color="danger"
                                variant="light"
                                onClick={() => {
                                  setCurrentJobPostingId(item.job_posting_id);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <MdDelete />
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            onClick={() =>
                              handleAction(
                                itemId,
                                itemEmail,
                                "approved",
                                itemData
                              )
                            }
                          >
                            Approve anyway
                          </Button>
                        )}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell className="text-center">
                      {item[columnKey as keyof typeof item]}
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ValidationComponent;
