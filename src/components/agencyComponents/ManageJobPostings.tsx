"use client";

import {
  deleteJobPosting,
  insertJobPosting,
  updateJobPosting,
} from "@/app/api/jobPostingsIUD";
import { RootState } from "@/app/reduxUtils/store";
import useJobPostings from "@/hooks/useJobPostings";
import { capitalizeFirstLetter, formatDate } from "@/utils/compUtils";
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
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
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
  agency_id?: string; // Optional field
}

const ManageJobPostingsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<"insert" | "update">("insert");
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const [openPopoverJobId, setOpenPopoverJobId] = useState<string | null>(null);

  const togglePopover = (jobId: string) => {
    if (openPopoverJobId === jobId) {
      setOpenPopoverJobId(null);
    } else {
      setOpenPopoverJobId(jobId);
    }
  };

  // Form state for job posting
  const [jobForm, setJobForm] = useState<JobForm>({
    job_title: "",
    job_description: "",
    job_location: "",
    job_type: "",
    salary_range: "",
    industry: "",
    application_deadline: "",
    agency_id: undefined,
  });

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const {
    jobPostings,
    totalJobPostings,
    loadingJobPostings,
    errorJobPostings,
  } = useJobPostings(rowsPerPage, page, userId);

  const totalPages = Math.ceil(totalJobPostings / rowsPerPage);

  const handleModalOpen = (type: "insert" | "update", job?: any) => {
    setModalType(type);
    setOpenModal(true);
    setOpenPopoverJobId(null);
    if (type === "update" && job) {
      setSelectedJob(job);
      setJobForm({
        job_title: job.job_title,
        job_description: job.job_description,
        job_location: job.job_location,
        job_type: job.job_type,
        salary_range: job.salary_range,
        industry: job.industry,
        application_deadline: job.application_deadline,
      });
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
        agency_id: userId,
      });
    }
  };

  const handleInputChange = (e: any) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (modalType === "insert") {
      await insertJobPosting(jobForm);
    } else if (modalType === "update" && selectedJob) {
      await updateJobPosting(selectedJob.job_posting_id, jobForm);
    }
    setOpenModal(false);
  };

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
                    !jobForm.job_description
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-24">
              {jobPostings.map((job) => (
                <JobPostingDetails
                  key={job.job_posting_id}
                  job={job}
                  openPopoverJobId={openPopoverJobId}
                  togglePopover={togglePopover}
                  onEdit={() => handleModalOpen("update", job)}
                  onDelete={() => {
                    setOpenPopoverJobId(null);
                    deleteJobPosting(job.job_posting_id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const JobPostingDetails = ({
  job,
  openPopoverJobId,
  togglePopover,
  onEdit,
  onDelete,
}: {
  job: any;
  openPopoverJobId: string | null;
  togglePopover: (jobId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const currentDate = new Date();
  const applicationDeadline = new Date(job.application_deadline);

  const isInactive =
    job.job_status === "inactive" || applicationDeadline < currentDate;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">{job.job_title}</h2>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-gray-600">
              {formatDate(job.application_deadline)}
            </p>
            <span>|</span>
            {job.industry && (
              <>
                <p className="text-xs text-gray-600">{job.industry}</p>
                <span>|</span>
              </>
            )}
            <p className="text-xs text-gray-600">{job.job_type}</p>
          </div>
        </div>
        <Popover
          placement="bottom"
          isOpen={openPopoverJobId === job.job_posting_id}
          onOpenChange={() => togglePopover(job.job_posting_id)}
        >
          <PopoverTrigger>
            <Button variant="light">
              <BsThreeDotsVertical />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="gap-2 p-2">
            <Button
              fullWidth
              size="sm"
              startContent={<MdOutlineEdit />}
              onPress={onEdit}
            >
              Edit
            </Button>
            <Button
              fullWidth
              size="sm"
              startContent={<IoMdTrash />}
              onPress={onDelete}
            >
              Delete
            </Button>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardBody className="whitespace-pre-wrap overflow-hidden">
        <p>
          <strong>Job Location:</strong> {job.job_location}
        </p>
        <p>
          <strong>Salary Range:</strong> {job.salary_range || "N/A"}
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <h2 className="font-bold text-lg">About the Job</h2>
          {/* <div className="h-56 overflow-y-auto"> */}
          <div className="w-full text-justify">
            {/* <p className="p text-sm">{job.job_description}</p> */}
            <p className="text-sm text-ellipsis">{job.job_description}</p>
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex justify-between items-center pt-0">
        <p className="flex flex-col items-center">
          {formatDate(job.date_posted)}
          <span className="text-xs text-gray-500">Date Posted</span>
        </p>
        <Button
          color={
            isInactive
              ? "danger"
              : job.job_status === "approved"
              ? "success"
              : "default"
          }
          isDisabled
        >
          {isInactive ? "Inactive" : capitalizeFirstLetter(job.job_status)}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ManageJobPostingsComponent;
