"use client";

import { colleges, programs } from "@/app/api/collegeAndProgramData";
import {
  deleteJobPosting,
  insertJobPosting,
  updateJobPosting,
} from "@/app/api/jobPostingsIUD";
import { insertNotification } from "@/app/api/notificationsIUD";
import { RootState } from "@/app/reduxUtils/store";
import useJobPostingsForAgency from "@/hooks/useJobPostingsForAgency";
import useUsers from "@/hooks/useUsers";
import { formatDate, sendEmailNotification } from "@/utils/compUtils";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Pagination,
  Spinner,
  Input,
  Textarea,
  SelectItem,
  Select,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import { useEffect, useMemo, useState } from "react";
import { IoMdTrash } from "react-icons/io";
import { IoAddCircleSharp } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { useSelector } from "react-redux";

interface JobForm {
  job_title: string;
  job_description: string;
  job_location: string;
  job_type: string;
  salary_range: string;
  industry: string;
  application_deadline: string;
  programs: string[];
  agency_id?: string; // Optional field
  number_of_applicants: number;
  requirements: string[];
}

const ManageJobPostingsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<"insert" | "update">("insert");
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // limited to 1000 alumni users only
  const { usersData } = useUsers(1000, 1, "alumni", "approved");

  // Form state for job posting
  const [jobForm, setJobForm] = useState<JobForm>({
    job_title: "",
    job_description: "",
    job_location: "",
    job_type: "",
    salary_range: "",
    industry: "",
    application_deadline: "",
    programs: [],
    agency_id: undefined,
    number_of_applicants: 0,
    requirements: [],
  });

  // Add new state for selected colleges
  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(
    new Set()
  );

  // Function to get programs for selected colleges
  const getProgramsForCollege = (collegeKey: string) => {
    return programs.filter((program) => program.college === collegeKey);
  };

  // Function to handle college selection
  const handleCollegeSelection = (selectedKeys: any) => {
    const typedKeys = selectedKeys as Set<string>;
    setSelectedColleges(typedKeys);

    // Get all programs for selected colleges
    const newPrograms = Array.from(typedKeys).flatMap((college) =>
      college === "all"
        ? programs.map((p) => p.key)
        : getProgramsForCollege(college).map((program) => program.key)
    );

    setJobForm((prev) => ({
      ...prev,
      programs: newPrograms,
    }));
  };

  // Function to get college from program
  const getCollegeFromProgram = (programKey: string): string | undefined => {
    const program = programs.find((p) => p.key === programKey);
    return program?.college;
  };

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const { jobPostings, totalJobPostings, loadingJobPostings } =
    useJobPostingsForAgency(rowsPerPage, page, userId);

  const totalPages = Math.ceil(totalJobPostings / rowsPerPage);

  const isMoaExpired = () => {
    if (!user?.user_metadata?.moa_year_end) return true;
    const moaEndDate = new Date(user.user_metadata.moa_year_end);
    const today = new Date();
    return moaEndDate < today;
  };

  const handleModalOpen = (type: "insert" | "update", job?: any) => {
    if (type === "insert" && isMoaExpired()) {
      alert(
        "Your MOA has expired. Please update your MOA in your profile before creating new job postings."
      );
      return;
    }

    setModalType(type);
    setOpenModal(true);
    if (type === "update" && job) {
      // Initialize programsData with an empty array if job.programs is null/undefined
      let programsData: string[] = [];

      if (job.programs) {
        if (Array.isArray(job.programs)) {
          programsData = job.programs;
        } else if (job.programs instanceof Set) {
          programsData = Array.from(job.programs);
        } else if (typeof job.programs === "string") {
          programsData = job.programs
            .split(",")
            .map((p: any) => p.trim())
            .filter(Boolean);
        }
      }

      setSelectedJob(job);
      setJobForm({
        job_title: job.job_title || "",
        job_description: job.job_description || "",
        job_location: job.job_location || "",
        job_type: job.job_type || "",
        salary_range: job.salary_range || "",
        industry: job.industry || "",
        programs: programsData,
        application_deadline: job.application_deadline || "",
        number_of_applicants: job.number_of_applicants || 0,
        requirements: job.requirements || [],
      });

      // Only process colleges if there are programs
      const collegesFromPrograms = new Set<string>(
        programsData
          .map(getCollegeFromProgram)
          .filter((college: any): college is string => college !== undefined)
      );
      setSelectedColleges(collegesFromPrograms);
    } else {
      // Reset form for insert
      setJobForm({
        job_title: "",
        job_description: "",
        job_location: "",
        job_type: "",
        salary_range: "",
        industry: "",
        application_deadline: "",
        programs: [],
        agency_id: userId,
        number_of_applicants: 0,
        requirements: [],
      });

      // Reset selected colleges for insert
      setSelectedColleges(new Set());
    }
  };

  const handleInputChange = (e: any) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value,
    });
  };

  const selectedPrograms = useMemo(() => {
    return new Set(jobForm.programs);
  }, [jobForm.programs]);

  const handleSelectMultipleChange = (name: string, value: Set<string>) => {
    // Convert Set to simple array of strings
    const programsArray = Array.from(value);

    setJobForm({
      ...jobForm,
      [name]: programsArray,
    });
  };

  const selectedRequirements = useMemo(() => {
    return new Set(jobForm.requirements);
  }, [jobForm.requirements]);

  const handleSubmit = async () => {
    const filteredUsersData = jobForm.programs?.length
      ? usersData.filter((user: any) =>
          jobForm.programs.includes(user.meta_data.program)
        )
      : usersData;

    if (modalType === "insert") {
      await insertJobPosting(jobForm);

      const notifications = filteredUsersData.map((user: any) => ({
        receiver_id: user.id,
        message: `New job posting: ${jobForm.job_title} has been posted.`,
      }));

      await Promise.all(notifications.map(insertNotification));

      const emailNotifications = filteredUsersData.map((user: any) => {
        const alumniSendEmailData = {
          email: user.email,
          recipient_name: `${user.first_name} ${user.last_name}`,
          subject: "New Job Posting",
          message: `
  Greetings!
  
  A new job posting has been posted by the agency. Here are the details:
  - Job Title: ${jobForm.job_title}
  - Job Type: ${jobForm.job_type}
  - Location: ${jobForm.job_location}
  - Industry: ${jobForm.industry}
  - Application Deadline: ${jobForm.application_deadline}
  - Salary Range: PHP ${jobForm.salary_range}
  - Job Description: ${jobForm.job_description}
  
  For more information, please visit the job postings page.
  
  Best regards,
  JPTS Team`,
        };
        return sendEmailNotification(alumniSendEmailData);
      });

      await Promise.all(emailNotifications);
    } else if (modalType === "update" && selectedJob) {
      const res = await updateJobPosting(selectedJob.job_posting_id, jobForm);
    }
    setOpenModal(false);
  };

  const columns = [
    { key: "job_title", label: "Job Title" },
    { key: "industry", label: "Industry" },
    { key: "job_type", label: "Job Type" },
    { key: "application_deadline", label: "Application Deadline" },
    { key: "action", label: "Action" },
  ];

  if (loadingJobPostings) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <>
      <Modal
        backdrop="blur"
        isOpen={openModal}
        onOpenChange={setOpenModal}
        className="size-full lg:size-fit"
      >
        <ModalContent className="overflow-y-auto">
          {(onClose) => (
            <>
              <ModalHeader>
                {modalType === "insert"
                  ? "Create Job Posting"
                  : "Update Job Posting"}
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Input
                    label="Job Title"
                    placeholder="Enter job title"
                    name="job_title"
                    value={jobForm.job_title}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                  <Input
                    label="Job Type"
                    placeholder="Enter job type (e.g., Full-time)"
                    name="job_type"
                    value={jobForm.job_type}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                  <Input
                    label="Location"
                    placeholder="Enter job location"
                    name="job_location"
                    value={jobForm.job_location}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                  <Input
                    type="number"
                    label="# of Applicants Needed"
                    placeholder="Enter number of applicants"
                    name="number_of_applicants"
                    value={jobForm.number_of_applicants?.toString()}
                    onChange={(e) =>
                      setJobForm({
                        ...jobForm,
                        number_of_applicants: parseInt(e.target.value) || 0,
                      })
                    }
                    className="col-span-2 md:col-span-1"
                  />
                  <Input
                    label="Industry"
                    placeholder="Enter industry"
                    name="industry"
                    value={jobForm.industry}
                    onChange={handleInputChange}
                    className="col-span-2 md:col-span-1"
                  />
                  <Input
                    label="Application Deadline"
                    type="date"
                    name="application_deadline"
                    value={jobForm.application_deadline}
                    onChange={handleInputChange}
                    className="col-span-2 md:col-span-1"
                  />
                  <Input
                    label="Salary Range"
                    placeholder="Enter salary range"
                    name="salary_range"
                    value={jobForm.salary_range}
                    startContent="PHP"
                    onChange={handleInputChange}
                    className="col-span-2 md:col-span-1"
                  />
                  {/* Requiments: PDS, Civil Service Exam Eligibility, Certificate of Training/s and Seminars and Certificate of Employment, TOR, and Work Portfolio */}
                  <Select
                    label="Requirements"
                    placeholder="Select requirements"
                    selectionMode="multiple"
                    selectedKeys={selectedRequirements}
                    onSelectionChange={(value) =>
                      handleSelectMultipleChange(
                        "requirements",
                        value as Set<string>
                      )
                    }
                    className="col-span-2 md:col-span-2"
                  >
                    <SelectItem key="PDS">PDS</SelectItem>
                    <SelectItem key="Civil Service Exam Eligibility">
                      Civil Service Exam Eligibility
                    </SelectItem>
                    <SelectItem key="Certificate of Training/s and Seminars">
                      Certificate of Training/s and Seminars
                    </SelectItem>
                    <SelectItem key="Certificate of Employment">
                      Certificate of Employment
                    </SelectItem>
                    <SelectItem key="TOR">TOR</SelectItem>
                    <SelectItem key="Work Portfolio">Work Portfolio</SelectItem>
                  </Select>

                  <Select<any>
                    label="Select Colleges"
                    placeholder="Select colleges"
                    selectionMode="multiple"
                    selectedKeys={selectedColleges}
                    onSelectionChange={handleCollegeSelection}
                    className="col-span-2"
                    items={[{ key: "all", label: "All Colleges" }, ...colleges]}
                  >
                    {(college) => (
                      <SelectItem key={college.key}>{college.label}</SelectItem>
                    )}
                  </Select>

                  {selectedColleges && selectedColleges.size > 0 && (
                    <Select
                      label="Programs"
                      placeholder="Select specific programs"
                      selectionMode="multiple"
                      selectedKeys={new Set(jobForm.programs)}
                      onSelectionChange={(value) => {
                        handleSelectMultipleChange(
                          "programs",
                          value as Set<string>
                        );
                      }}
                      className="col-span-2"
                    >
                      {Array.from(selectedColleges)
                        .flatMap((collegeKey) =>
                          collegeKey === "all"
                            ? programs
                            : getProgramsForCollege(collegeKey)
                        )
                        .map((program) => (
                          <SelectItem
                            key={program.key}
                            textValue={program.label}
                          >
                            {program.label}
                          </SelectItem>
                        ))}
                    </Select>
                  )}

                  <Textarea
                    label="Job Description"
                    placeholder="Enter job description"
                    name="job_description"
                    value={jobForm.job_description}
                    onChange={handleInputChange}
                    minRows={3}
                    maxRows={5}
                    className="col-span-2"
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  isDisabled={
                    !jobForm.job_title ||
                    !jobForm.job_type ||
                    !jobForm.job_location ||
                    !jobForm.industry ||
                    !jobForm.application_deadline ||
                    !jobForm.salary_range ||
                    !jobForm.job_description ||
                    jobForm?.number_of_applicants === 0 ||
                    jobForm?.requirements?.length === 0
                  }
                  onClick={handleSubmit}
                >
                  {modalType === "insert" ? "Create Job" : "Update Job"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="h-full w-full flex flex-col gap-2">
        <div
          className={`${
            jobPostings.length === 0 ? "justify-end" : "justify-between"
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
            className={`${jobPostings.length === 0 && "hidden"}`}
          />
          <Button
            startContent={<IoAddCircleSharp size={20} />}
            onClick={() => handleModalOpen("insert")}
            isDisabled={isMoaExpired()}
          >
            Create New
          </Button>
        </div>
        <div className="flex-1 w-full overflow-y-auto relative">
          {jobPostings.length === 0 && (
            <div className="h-full w-full flex justify-center items-center -mt-16">
              <p>No job postings yet.</p>
            </div>
          )}

          {jobPostings && jobPostings.length > 0 && (
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
                  items={jobPostings}
                  emptyContent={"No job applications to display."}
                  loadingContent={<Spinner color="success" />}
                >
                  {(item) => (
                    <TableRow
                      key={item.job_posting_id}
                      className="text-center hover:bg-green-100"
                    >
                      {(columnKey) => {
                        if (columnKey === "application_deadline") {
                          return (
                            <TableCell className="text-center">
                              {formatDate(item.application_deadline)}
                            </TableCell>
                          );
                        }

                        if (columnKey === "action") {
                          return (
                            <TableCell className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                color="primary"
                                startContent={<MdOutlineEdit />}
                                onPress={() => handleModalOpen("update", item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                startContent={<IoMdTrash />}
                                onPress={() => {
                                  deleteJobPosting(item.job_posting_id);
                                }}
                              >
                                Delete
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

export default ManageJobPostingsComponent;
