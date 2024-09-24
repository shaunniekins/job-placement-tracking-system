"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
import { useEffect, useState } from "react";
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
} from "@nextui-org/react";
import { formatDate } from "@/utils/compUtils";
import { updateJobApplication } from "@/app/api/jobApplicationsIUD";
import { insertNotification } from "@/app/api/notificationsIUD";

const ApplicationsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const {
    jobApplications,
    totalJobApplications,
    loadingJobApplications,
    errorJobApplications,
  } = useJobApplications(rowsPerPage, page, userId);

  const totalPages = Math.ceil(totalJobApplications / rowsPerPage);

  if (loadingJobApplications) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  const columns = [
    { key: "job_title", label: "Job Title" },
    { key: "applicant_name", label: "Applicant Name" },
    { key: "application_date", label: "Application Date" },
    { key: "action", label: "Action" },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div
        className={`${
          jobApplications.length === 0 ? "justify-end" : "justify-between"
        } flex items-center`}
      >
        <Pagination
          isCompact
          showControls
          showShadow
          color="default"
          page={page}
          total={totalPages}
          onChange={(newPage) => setPage(newPage)}
          className={`${jobApplications.length === 0 && "hidden"}`}
        />
        <Button className="invisible" />
      </div>
      <div className="flex h-full w-full overflow-y-auto relative">
        {jobApplications.length === 0 && (
          <div className="h-full w-full flex justify-center items-center -mt-16">
            <p>No job applications yet.</p>
          </div>
        )}

        {jobApplications && jobApplications.length > 0 && (
          <div className="h-full">
            <Table
              fullWidth
              layout="fixed"
              isHeaderSticky={true}
              aria-label="Job Applications Table"
              classNames={{
                wrapper: "h-full bg-[#F4FFFC] border-2 border-[#007057]",
              }}
              className="h-full w-full flex items-center justify-center"
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    className="bg-[#007057] text-white text-center whitespace-nowrap flex-nowrap"
                  >
                    {column.label}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                items={jobApplications}
                emptyContent={"No job applications to display."}
                loadingContent={<Spinner color="success" />}
              >
                {(item) => (
                  <TableRow
                    key={item.job_application_id}
                    className="text-center hover:bg-green-100"
                  >
                    {(columnKey) => {
                      if (columnKey === "applicant_name") {
                        return (
                          <TableCell className="text-center">
                            {item.applicant_last_name},{" "}
                            {item.applicant_first_name}{" "}
                            {item.applicant_middle_name &&
                              item.applicant_middle_name.charAt(0) + "."}
                          </TableCell>
                        );
                      }

                      if (columnKey === "application_date") {
                        return (
                          <TableCell className="text-center">
                            {formatDate(item.application_date)}
                          </TableCell>
                        );
                      }

                      if (columnKey === "action") {
                        return (
                          <TableCell className="flex justify-center">
                            <Select
                              aria-label="Action Setter"
                              disallowEmptySelection={true}
                              size="sm"
                              color="success"
                              defaultSelectedKeys={[item.application_status]}
                              disabledKeys={
                                item.application_status !== "pending"
                                  ? ["pending"]
                                  : []
                              }
                              className="max-w-48"
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                const response = await updateJobApplication(
                                  item.job_application_id,
                                  {
                                    application_status: newStatus,
                                  }
                                );

                                if (response) {
                                  let message = "";
                                  switch (newStatus) {
                                    case "accepted":
                                      message = `Congratulations! Your application for the job posting: ${item.job_title} has been accepted.`;
                                      break;
                                    case "rejected":
                                      message = `We are sorry to inform you that your application for the job posting: ${item.job_title} has been rejected.`;
                                      break;
                                    case "interview":
                                      message = `The agency has decided to move forward with your application for the job posting: ${item.job_title} and would like to schedule an interview.`;
                                      break;
                                    default:
                                      message = "";
                                  }

                                  if (message) {
                                    await insertNotification(
                                      {
                                        receiver_id: item.applicant_id,
                                        message: message,
                                      },
                                      item.applicant_email
                                    );
                                  }
                                }
                              }}
                            >
                              <SelectItem
                                key="pending"
                                value="pending"
                                className="text-center"
                              >
                                Pending
                              </SelectItem>
                              <SelectItem
                                key="interview"
                                value="interview"
                                className="text-center"
                              >
                                Interview
                              </SelectItem>
                              <SelectItem
                                key="accepted"
                                value="accepted"
                                className="text-center"
                              >
                                Accepted
                              </SelectItem>
                              <SelectItem
                                key="rejected"
                                value="rejected"
                                className="text-center"
                              >
                                Rejected
                              </SelectItem>
                            </Select>
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
        )}
      </div>
    </div>
  );
};

export default ApplicationsComponent;
