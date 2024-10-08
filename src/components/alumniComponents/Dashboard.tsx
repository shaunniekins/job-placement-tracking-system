"use client";

import useJobPostings from "@/hooks/useJobPostings";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@nextui-org/react";
import { capitalizeFirstLetter, formatDate } from "@/utils/compUtils";
import { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import {
  checkIfApplied,
  insertJobApplication,
} from "@/app/api/jobApplicationsIUD";
import { insertNotification } from "@/app/api/notificationsIUD";

const AlumniDashboardComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  const {
    jobPostings,
    totalJobPostings,
    loadingJobPostings,
    errorJobPostings,
  } = useJobPostings(rowsPerPage, page, undefined, "approved");

  const totalPages = Math.ceil(totalJobPostings / rowsPerPage);

  if (loadingJobPostings) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full flex flex-1 gap-2">
        <div className="h-full w-full flex flex-col gap-2">
          <div className="flex items-center">
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
          </div>
          <div className="h-full flex-1 w-full overflow-y-auto relative">
            {jobPostings.length === 0 && (
              <div className="h-full w-full flex justify-center items-center -mt-16">
                <p>No job postings yet.</p>
              </div>
            )}

            {jobPostings && jobPostings.length > 0 && (
              <div className="flex flex-col gap-4 mb-24">
                {jobPostings.map((job) => (
                  <JobPostingDetails
                    key={job.job_posting_id}
                    job={job}
                    userId={user?.id}
                    userEmail={user?.email}
                    userName={`${user?.user_metadata.first_name} ${user?.user_metadata.last_name}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="h-full w-full bg-green-50">
          <div className="h-full w-full flex items-center justify-center">
            SOON
          </div>
        </div>
      </div>
    </>
  );
};

const JobPostingDetails = ({
  job,
  userId,
  userEmail,
  userName,
}: {
  job: any;
  userId: string;
  userEmail: string;
  userName: string;
}) => {
  const [visible, setVisible] = useState(false);
  const [isApplied, setIsApplied] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await fetchApplicationStatus(job.job_posting_id);
      setIsApplied(status);
    };

    fetchStatus();
  }, [job.job_posting_id]);

  const fetchApplicationStatus = async (jobPostingId: number) => {
    return await checkIfApplied(userId, jobPostingId);
  };

  const handleSubmit = async () => {
    setVisible(false);

    const newJobApplication = {
      applicant_id: userId,
      job_posting_id: job.job_posting_id,
    };

    const response = await insertJobApplication(newJobApplication);

    if (response) {
      // notify agency
      await insertNotification(
        {
          receiver_id: job.agency_id,
          message: `New application for job posting: ${job.job_title} by ${userName}.`,
        },
        job.agency_email
      );

      // notify user
      await insertNotification(
        {
          receiver_id: userId,
          message: `You have successfully applied for the job posting: ${job.job_title}. Please expect further communication from the agency.`,
        },
        userEmail
      );

      setIsApplied(true);
    }
  };

  return (
    <>
      <Modal
        backdrop="blur"
        isDismissable={false}
        hideCloseButton={true}
        isOpen={visible}
        onOpenChange={setVisible}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h1>Confirm Application</h1>
              </ModalHeader>
              <ModalBody>
                <h1>
                  Are you sure you want to apply for this job? Your profile
                  information will be shared with the agency.
                </h1>
              </ModalBody>
              <ModalFooter>
                <Button color="warning" onPress={() => setVisible(false)}>
                  Cancel
                </Button>
                <Button color="success" onPress={handleSubmit}>
                  Confirm
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
        </CardHeader>
        <CardBody className="whitespace-pre-wrap overflow-hidden text-ellipsis truncate">
          <p>
            <strong>Job Location:</strong> {job.job_location}
          </p>
          <p>
            <strong>Salary Range:</strong> {job.salary_range || "N/A"}
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <h2 className="font-bold text-lg">About the Job</h2>
            <div className="h-28 w-full text-justify">
              {/* truncate */}
              <p className="text-sm text-ellipsis">{job.job_description}</p>
            </div>
          </div>
        </CardBody>
        <CardFooter className="flex justify-between items-center">
          <p className="flex flex-col items-center">
            {formatDate(job.date_posted)}
            <span className="text-xs text-gray-500">Data Posted</span>
          </p>
          <Button
            size="sm"
            color={isApplied ? "default" : "success"}
            isDisabled={isApplied === null ? true : isApplied}
            onPress={() => setVisible(true)}
            className={`${!isApplied && "text-white"}`}
          >
            {isApplied ? "You already applied" : "Apply"}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default AlumniDashboardComponent;
