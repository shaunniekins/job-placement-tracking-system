"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
import { Key, useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
} from "@nextui-org/react";
import useUsers from "@/hooks/useUsers";
import { supabaseAdmin } from "@/utils/supabase";
import { FaCheck } from "react-icons/fa";
import { IoMdCheckmark, IoMdClose } from "react-icons/io";
import { IoCheckmark } from "react-icons/io5";
import { updateJobPosting } from "@/app/api/jobPostingsIUD";
import useJobPostings from "@/hooks/useJobPostings";

const ValidationComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const [currentView, setCurrentView] = useState("agency");
  const [currenViewContent, setCurrentViewContent] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const handleTabSelectionChange = (key: Key) => {
    const keyString = key.toString();
    if (keyString !== currentView) {
      setCurrentView(keyString);
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
    userId: string,
    action: string,
    userData: any
  ) => {
    if (currentView === "agency" || currentView === "alumni") {
      try {
        const { data: user, error } =
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { account_status: action },
          });
        if (error) throw error;

        // Send notification to the agency or alumni
        const notificationData = {
          recipient_id: userId,
          message: `Your account status has been updated to ${action}.`,
          type: "account_status_update",
        };
        // await sendNotification(notificationData);
        fetchAndSubscribeUsers();

        if (action === "approved" && user) {
          const emailData = {
            email: userData.email,
            recipient_name: `${userData.first_name} ${userData.last_name}`,
            subject: "Account Approved",
            message: `
              Greetings!
              We are pleased to inform you that your account associated with the email ${userData.email} has been approved. You can now sign in and access your account.
              Thank you!
              Best regards,
              Agri Advice Team`,
          };
          try {
            const response = await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emailData),
            });
            const data = await response.json();
            if (!response.ok) {
              console.log(
                `Failed to send email: ${data?.error || "Unknown error"}`
              );
            }
          } catch (error) {
            console.error("Error sending email:", error);
          }
        }
      } catch (error) {
        console.error("Error updating:", error);
      }
    } else if (currentView === "job_postings") {
      try {
        const jobId = parseInt(userId, 10);
        const job = await updateJobPosting(jobId, {
          job_status: action,
        });
        if (!job) throw new Error("Failed to update job posting");

        // Send notification to the agency
        const notificationData = {
          recipient_id: userData.agency_id,
          message: `The job posting status has been updated to ${action}.`,
          type: "job_status_update",
        };
        // await sendNotification(notificationData);
        fetchJobPostings();
      } catch (error) {
        console.error("Error updating job posting:", error);
      }
    }
  };

  // send notification function
  const sendNotification = async (notificationData: any) => {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("Notification sent successfully!");
      } else {
        console.log(
          `Failed to send notification: ${data?.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2">
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
                  <span>Agency</span>
                </div>
              }
            />
            <Tab
              key="alumni"
              title={
                <div className="flex items-center space-x-2">
                  <span>Graduates</span>
                </div>
              }
            />
            <Tab
              key="job_postings"
              title={
                <div className="flex items-center space-x-2">
                  <span>Job Applications</span>
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
                const selectedKey = Array.from(keys)[0]; // Assuming single selection
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
            wrapper: "h-full bg-[#F4FFFC] border-2 border-[#007057]",
          }}
          className="h-full w-full flex items-center justify-center"
        >
          <TableHeader columns={currentColumns}>
            {(column) => (
              <TableColumn
                key={column.key}
                className={`${column.key === "seen" && "lg:w-36"}
                     ${column.key === "message" && "w-32 lg:w-auto"} 
                    bg-[#007057] text-white text-center whitespace-nowrap flex-nowrap`}
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
                        <TableCell className="text-center">
                          {item.meta_data.college}
                        </TableCell>
                      );
                    }

                    if (columnKey === "program") {
                      return (
                        <TableCell className="text-center">
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
                    return (
                      <TableCell className="flex items-center justify-center gap-4">
                        {currentView === "agency" ||
                        currentView === "alumni" ? (
                          item.meta_data.account_status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                isIconOnly
                                color="success"
                                onClick={() =>
                                  handleAction(
                                    item.id,
                                    "approved",
                                    item.meta_data
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
                                    item.id,
                                    "declined",
                                    item.meta_data
                                  )
                                }
                              >
                                <IoMdClose />
                              </Button>
                            </>
                          ) : item.meta_data.account_status === "approved" ? (
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isDisabled={true}
                            >
                              <IoMdCheckmark />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              color="success"
                              onClick={() =>
                                handleAction(
                                  item.id,
                                  "approved",
                                  item.meta_data
                                )
                              }
                            >
                              Approve anyway
                            </Button>
                          )
                        ) : currentView === "job_postings" ? (
                          item.job_status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                isIconOnly
                                color="success"
                                onClick={() =>
                                  handleAction(
                                    item.job_posting_id,
                                    "approved",
                                    item
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
                                    item.job_posting_id,
                                    "declined",
                                    item
                                  )
                                }
                              >
                                <IoMdClose />
                              </Button>
                            </>
                          ) : item.job_status === "approved" ? (
                            <Button
                              size="sm"
                              isIconOnly
                              color="success"
                              isDisabled={true}
                            >
                              <IoMdCheckmark />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              color="success"
                              onClick={() =>
                                handleAction(
                                  item.job_posting_id,
                                  "approved",
                                  item
                                )
                              }
                            >
                              Approve anyway
                            </Button>
                          )
                        ) : null}
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
