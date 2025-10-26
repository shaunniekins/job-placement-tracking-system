"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
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
  Input,
  Select,
  SelectItem,
  Selection,
} from "@nextui-org/react";
import { formatDate } from "@/utils/compUtils";
import AlumniProfileModal from "./AlumniProfileModal";
import ApplicationStatusModalComponent from "../ApplicationStatusModal";
import { programs } from "@/app/api/collegeAndProgramData";
import { getJobApplicationById } from "@/app/api/jobApplicationsIUD";

const ApplicationsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;
  const [currentAlumniId, setCurrentAlumniId] = useState("");
  const [isAlumniProfileOpen, setIsAlumniProfileOpen] = useState(false);
  const [isActionModal, setIsActionModal] = useState(false);
  const [currentJobApplicationId, setCurrentJobApplicationId] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [currentApplicantId, setCurrentApplicantId] = useState("");
  const [currentApplicantEmail, setCurrentApplicantEmail] = useState("");
  const [currentApplicantFirstName, setCurrentApplicantFirstName] =
    useState("");
  const [currentApplicantLastName, setCurrentApplicantLastName] = useState("");
  const [currentJobPostingId, setCurrentJobPostingId] = useState<number | null>(
    null
  );
  const [searchInput, setSearchInput] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [viewerUserType, setViewerUserType] = useState("agency");

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const { jobApplications, totalJobApplications, loadingJobApplications } =
    useJobApplications(
      rowsPerPage,
      page,
      userId,
      undefined,
      searchInput,
      programFilter
    );

  const totalPages = Math.ceil(totalJobApplications / rowsPerPage);

  useEffect(() => {
    if (!user) return;

    const applicationId = searchParams.get("applicationId");
    const alumniId = searchParams.get("alumniId");

    // Handle alumni profile modal
    if (alumniId) {
      setCurrentAlumniId(alumniId);
      setIsAlumniProfileOpen(true);
    }

    // Handle application status modal
    const handleApplicationModal = async () => {
      if (applicationId && !loadingJobApplications) {
        // First try to find in current page
        let application = jobApplications.find(
          (app) => app.job_application_id === applicationId
        );

        // If not found in current page, fetch it directly
        if (!application) {
          application = await getJobApplicationById(applicationId);
        }

        if (application) {
          setCurrentJobApplicationId(application.job_application_id);
          setCurrentJobTitle(application.job_title);
          setCurrentApplicantId(application.applicant_id);
          setCurrentApplicantEmail(application.applicant_email);
          setCurrentApplicantFirstName(application.applicant_first_name);
          setCurrentApplicantLastName(application.applicant_last_name);
          setCurrentJobPostingId(application.job_posting_id);
          setIsActionModal(true);
        } else {
          // Application not found, clear the URL parameter
          updateUrlParams({ applicationId: null });
        }
      }
    };

    handleApplicationModal();
  }, [searchParams, user, jobApplications, loadingJobApplications]);

  const updateUrlParams = (params: { [key: string]: string | null }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const columns = [
    { key: "job_title", label: "Job Title" },
    { key: "applicant_name", label: "Applicant Name" },
    { key: "application_date", label: "Application Date" },
    { key: "action", label: "Action" },
  ];

  return (
    <>
      <AlumniProfileModal
        alumniId={currentAlumniId}
        setAlumniId={setCurrentAlumniId}
        openAlumniProfile={isAlumniProfileOpen}
        setOpenAlumniProfile={(isOpen) => {
          setIsAlumniProfileOpen(isOpen);
          if (!isOpen) {
            updateUrlParams({ alumniId: null });
          }
        }}
        userType="alumni"
        viewerType={viewerUserType}
      />
      <ApplicationStatusModalComponent
        isOpen={isActionModal}
        setIsOpen={(isOpen) => {
          setIsActionModal(isOpen);
          if (!isOpen) {
            updateUrlParams({ applicationId: null });
          }
        }}
        currentJobApplicationId={currentJobApplicationId}
        jobTitle={currentJobTitle}
        applicantId={currentApplicantId}
        applicantEmail={currentApplicantEmail}
        applicantFirstName={currentApplicantFirstName}
        applicantLastName={currentApplicantLastName}
        jobPostingId={currentJobPostingId}
      />
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
          <div className="flex items-center gap-2">
            <Input
              label="Search"
              size="sm"
              fullWidth
              placeholder="Search name or job title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Select
              size="sm"
              fullWidth
              label="Program Filter"
              placeholder="Select program"
              className="uppercase"
              items={programs}
              onChange={(e) => setProgramFilter(e.target.value)}
            >
              {programs.map((item) => (
                <SelectItem key={item.key} className="uppercase">
                  {item.key}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex h-full w-full overflow-y-auto relative">
          {jobApplications.length === 0 && (
            <div className="h-full w-full flex justify-center items-center -mt-16">
              <p>No job applications found.</p>
            </div>
          )}

          {jobApplications && jobApplications.length > 0 && (
            <div className="flex h-full w-full overflow-y-auto">
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
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn
                      key={column.key}
                      className="bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap"
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
                            <TableCell className="flex justify-center items-center gap-2">
                              <Button
                                size="sm"
                                color="success"
                                className="text-white"
                                onClick={() => {
                                  setCurrentJobApplicationId(
                                    item.job_application_id
                                  );
                                  setCurrentJobTitle(item.job_title);
                                  setCurrentApplicantId(item.applicant_id);
                                  setCurrentApplicantEmail(
                                    item.applicant_email
                                  );
                                  setCurrentApplicantFirstName(
                                    item.applicant_first_name
                                  );
                                  setCurrentApplicantLastName(
                                    item.applicant_last_name
                                  );
                                  setCurrentJobPostingId(item.job_posting_id);
                                  setIsActionModal(true);
                                  updateUrlParams({
                                    applicationId: item.job_application_id,
                                  });
                                }}
                              >
                                View Status
                              </Button>

                              <Button
                                size="sm"
                                color="success"
                                className="text-white"
                                onClick={() => {
                                  setCurrentAlumniId(item.applicant_id);
                                  setIsAlumniProfileOpen(true);
                                  updateUrlParams({
                                    alumniId: item.applicant_id,
                                    applicationId: null, // Clear applicationId to prevent status modal from opening
                                  });
                                }}
                              >
                                View Profile
                              </Button>
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
    </>
  );
};

export default ApplicationsComponent;
