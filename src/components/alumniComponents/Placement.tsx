"use client";

import { RootState } from "@/app/reduxUtils/store";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Input,
  Textarea,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumn,
  TableCell,
  SelectItem,
  Select,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoMdTrash } from "react-icons/io";
import { IoAddCircleSharp } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { formatDate } from "@/utils/compUtils";
import { useSelector } from "react-redux";
import useJobApplications from "@/hooks/useJobApplications";

const PlacementComponent = () => {
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
  } = useJobApplications(rowsPerPage, page, undefined, userId);

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
    { key: "agency_company_name", label: "Agency" },
    { key: "application_date", label: "Application Date" },
    { key: "application_status", label: "Status" },
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
                      if (columnKey === "application_date") {
                        return (
                          <TableCell className="text-center">
                            {formatDate(item.application_date)}
                          </TableCell>
                        );
                      }

                      if (columnKey === "application_status") {
                        return (
                          <TableCell
                            className={`
                          ${
                            item.application_status === "pending" &&
                            "text-yellow-500"
                          }
                          ${
                            item.application_status === "interview" &&
                            "text-purple-500"
                          }
                          ${
                            item.application_status === "accepted" &&
                            "text-green-500"
                          }
                          ${
                            item.application_status === "rejected" &&
                            "text-red-500"
                          }
                          text-center uppercase font-semibold`}
                          >
                            {item.application_status}
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

export default PlacementComponent;
