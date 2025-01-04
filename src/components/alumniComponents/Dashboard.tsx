"use client";

import useJobPostings from "@/hooks/useJobPostings";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@nextui-org/react";
import {
  formatActivityType,
  formatDate,
  sendEmailNotification,
} from "@/utils/compUtils";
import { Key, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/reduxUtils/store";
import {
  checkIfApplied,
  insertJobApplication,
} from "@/app/api/jobApplicationsIUD";
import { insertNotification } from "@/app/api/notificationsIUD";
import useActivities from "@/hooks/useActivities";
import { insertApplicationStatus } from "@/app/api/applicationStatusIUD";

const AlumniDashboardComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);

  const [jobPostingPage, setJobPostingPage] = useState(1);
  const jobPostingRowsPerPage = 15;

  const [activitiesPage, setActivitiesPage] = useState(1);
  const activitiesRowsPerPage = 15;

  const [currentView, setCurrentView] = useState("jobPostings");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isJobPostingModalOpen, setIsJobPostingModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");

  const { jobPostings, totalJobPostings, loadingJobPostings } = useJobPostings(
    jobPostingRowsPerPage,
    jobPostingPage,
    undefined,
    "approved",
    user?.user_metadata?.program,
    searchInput
  );

  // useEffect(() => {
  //   console.log("jobPostings: ", jobPostings);
  // }, [jobPostings]);

  const jobPostingTotalPages = Math.ceil(
    totalJobPostings / jobPostingRowsPerPage
  );

  const { activities, totalActivities, loadingActivities } = useActivities(
    activitiesRowsPerPage,
    activitiesPage
  );

  // useEffect(() => {
  //   console.log("activities: ", activities);
  // }, [activities]);

  const activitiesTotalPages = Math.ceil(
    totalActivities / activitiesRowsPerPage
  );

  const handleTabSelectionChange = (key: Key) => {
    const keyString = key.toString();
    if (keyString !== currentView) {
      setCurrentView(keyString);
    }
  };

  const jobPostingColumns = [
    { key: "job_title", label: "Job Title" },
    { key: "industry", label: "Industry" },
    { key: "agency_company_name", label: "Agency" },
    { key: "application_deadline", label: "Application Deadline" },
    { key: "action", label: "Action" },
  ];

  const activitiesColumns = [
    { key: "activity_title", label: "Activity Title" },
    { key: "activity_type", label: "Type" },
    { key: "activity_date", label: "Date" },
    { key: "action", label: "Action" },
  ];

  if (loadingJobPostings || loadingActivities) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full flex gap-6">
        <div
          className={`h-full w-full flex flex-col gap-2 overflow-y-auto overflow-x-hidden`}
        >
          <div className="w-full flex justify-between gap-2">
            <Tabs
              aria-label="Tab Options"
              selectedKey={currentView}
              color="success"
              size="lg"
              variant="underlined"
              onSelectionChange={handleTabSelectionChange}
            >
              <Tab key="jobPostings" title={"Job Postings"} />
              <Tab key="activities" title={"Activities"} />
            </Tabs>
            <div className="flex gap-5 items-center">
              <Input
                size="sm"
                className={`max-w-64 ${
                  currentView === "activities" && "hidden"
                }`}
                label="Search Agency or Job Title"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />

              <Pagination
                isCompact
                showControls
                showShadow
                color="default"
                page={
                  currentView === "jobPostings"
                    ? jobPostingPage
                    : activitiesPage
                }
                total={
                  currentView === "jobPostings"
                    ? jobPostingTotalPages
                    : activitiesTotalPages
                }
                onChange={(newPage) =>
                  currentView === "jobPostings"
                    ? setJobPostingPage(newPage)
                    : setActivitiesPage(newPage)
                }
                className={`${
                  (currentView === "jobPostings" ? jobPostings : activities)
                    .length === 0 && "hidden"
                }`}
              />
            </div>
          </div>

          <div className="h-full flex-1 w-full overflow-y-auto relative">
            {currentView === "jobPostings" ? (
              jobPostings.length === 0 ? (
                <div className="h-full w-full flex justify-center items-center -mt-16">
                  <p>No job postings yet.</p>
                </div>
              ) : (
                <div className="flex h-full w-full overflow-y-auto">
                  <Table
                    fullWidth
                    layout="auto"
                    isHeaderSticky={true}
                    aria-label="Job Postings Table"
                    classNames={{
                      wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
                    }}
                    className="h-full w-full flex items-center justify-center"
                  >
                    <TableHeader columns={jobPostingColumns}>
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
                      emptyContent={"No job postings to display."}
                      loadingContent={<Spinner color="success" />}
                    >
                      {(item) => (
                        <TableRow
                          key={item.job_posting_id}
                          className="text-center hover:bg-green-100"
                        >
                          {(columnKey) => {
                            if (columnKey === "job_title") {
                              return (
                                <TableCell className="text-center font-semibold">
                                  {item.job_title}
                                </TableCell>
                              );
                            }
                            if (columnKey === "application_deadline") {
                              return (
                                <TableCell className="text-center">
                                  {formatDate(item.application_deadline)}
                                </TableCell>
                              );
                            }

                            if (columnKey === "action") {
                              return (
                                <TableCell className="text-center">
                                  <Button
                                    size="sm"
                                    color="success"
                                    className="text-white"
                                    onClick={() => {
                                      setSelectedJob(item);
                                      setIsJobPostingModalOpen(true);
                                    }}
                                  >
                                    View
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
              )
            ) : // Activities Table
            activities.length === 0 ? (
              <div className="h-full w-full flex justify-center items-center -mt-16">
                <p>No activities yet.</p>
              </div>
            ) : (
              <div className="flex h-full w-full overflow-y-auto">
                <Table
                  fullWidth
                  layout="auto"
                  isHeaderSticky={true}
                  aria-label="Activities Table"
                  classNames={{
                    wrapper: "h-full bg-[#F4FFFC] border-2 border-[#008B47]",
                  }}
                >
                  <TableHeader columns={activitiesColumns}>
                    {(column) => (
                      <TableColumn
                        key={column.key}
                        className="bg-[#008B47] text-white text-center"
                      >
                        {column.label}
                      </TableColumn>
                    )}
                  </TableHeader>
                  <TableBody items={activities}>
                    {(item) => (
                      <TableRow key={item.activity_id}>
                        {(columnKey) => {
                          if (columnKey === "activity_type") {
                            return (
                              <TableCell className="text-center capitalize">
                                {formatActivityType(item.activity_type)}
                              </TableCell>
                            );
                          }

                          if (columnKey === "activity_date") {
                            return (
                              <TableCell className="text-center">
                                {formatDate(item.activity_date)}
                              </TableCell>
                            );
                          }
                          if (columnKey === "action") {
                            return (
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  color="success"
                                  className="text-white"
                                  onClick={() => {
                                    setSelectedActivity(item);
                                    setIsActivityModalOpen(true);
                                  }}
                                >
                                  View
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
      </div>

      {selectedJob && (
        <JobPostingDetails
          job={selectedJob}
          userId={user?.id}
          userEmail={user?.email}
          userName={user?.user_metadata?.first_name}
          isOpen={isJobPostingModalOpen}
          setIsOpen={setIsJobPostingModalOpen}
        />
      )}

      {selectedActivity && (
        <ActivityDetails
          activity={selectedActivity}
          isOpen={isActivityModalOpen}
          setIsOpen={setIsActivityModalOpen}
        />
      )}
    </>
  );
};

const JobPostingDetails = ({
  job,
  userId,
  userEmail,
  userName,
  isOpen,
  setIsOpen,
}: {
  job: any;
  userId: string;
  userEmail: string;
  userName: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const [isApplied, setIsApplied] = useState<boolean | null>(null);

  const currentDate = new Date();
  const applicationDeadline = new Date(job?.application_deadline);

  const isInactive =
    job?.job_status === "inactive" || applicationDeadline < currentDate;

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await fetchApplicationStatus(job.job_posting_id);
      setIsApplied(status);
    };

    fetchStatus();
  }, [job]);

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
      await insertApplicationStatus({
        job_application_id: response[0].job_application_id,
        date_applied: new Date().toISOString(),
      });

      // notify agency
      await insertNotification({
        receiver_id: job.agency_id,
        message: `New application for job posting: ${job.job_title} by ${userName}.`,
      });

      const agencySendEmailData = {
        email: job.agency_email,
        recipient_name: job.agency_name,
        subject: "New Job Application",
        message: `
        Greetings!

        There is a new application for the job posting: ${job.job_title} by ${userName}. Please check your dashboard for more details.

        Best regards,
        JPTS Team`,
      };

      await sendEmailNotification(agencySendEmailData);
      //

      // notify alumni user
      await insertNotification({
        receiver_id: userId,
        message: `You have successfully applied for the job posting: ${job.job_title}. Please expect further communication from the agency.`,
      });

      const alumniSendEmailData = {
        email: userEmail,
        recipient_name: userName,
        subject: "Job Application Confirmation",
        message: `
        Greetings!

        You have successfully applied for the job posting: ${job.job_title}. Please expect further communication from the agency. Thank you!
        
        Best regards,
        JPTS Team`,
      };

      await sendEmailNotification(alumniSendEmailData);
      //

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

      <Modal size="lg" backdrop="blur" isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex justify-between items-center pb-0">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold">{job?.job_title}</h2>
                  <div className="flex gap-2 items-center">
                    <p className="text-xs text-gray-600">
                      {job &&
                        job.application_deadline &&
                        formatDate(job?.application_deadline)}
                    </p>
                    <span>|</span>
                    {job?.industry && (
                      <>
                        <p className="text-xs text-gray-600">{job?.industry}</p>
                        <span>|</span>
                      </>
                    )}
                    <p className="text-xs text-gray-600">{job?.job_type}</p>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="whitespace-pre-wrap overflow-hidden text-ellipsis truncate">
                <p>
                  <strong>Job Location:</strong> {job?.job_location}
                </p>
                <p>
                  <strong>Salary Range:</strong> {job?.salary_range || "N/A"}
                </p>
                <p>
                  <strong>Eligible Programs:</strong>{" "}
                  {job?.programs
                    ?.map((program: string) => program.toUpperCase())
                    .join(", ")}
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <h2 className="font-bold text-lg">About the Job</h2>
                  <div className="w-full text-justify">
                    <p className="text-sm text-ellipsis">
                      {job?.job_description}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between items-center">
                <p className="flex flex-col items-center">
                  {job && job.date_posted && formatDate(job?.date_posted)}
                  <span className="text-xs text-gray-500">Date Posted</span>
                </p>
                <Button
                  size="sm"
                  color={
                    isApplied ? "default" : isInactive ? "danger" : "success"
                  }
                  isDisabled={isApplied || isInactive}
                  onPress={() => setVisible(true)}
                  className={`${!isApplied && !isInactive && "text-white"}`}
                >
                  {isApplied
                    ? "You already applied"
                    : isInactive
                    ? "Inactive"
                    : "Apply"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default AlumniDashboardComponent;

const ActivityDetails = ({
  activity,
  isOpen,
  setIsOpen,
}: {
  activity: any;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) => {
  return (
    <Modal size="lg" backdrop="blur" isOpen={isOpen} onOpenChange={setIsOpen}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex justify-between items-center pb-0">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold">
                  {activity.activity_title}
                </h2>
                <div className="flex gap-2 items-center">
                  <p className="text-xs text-gray-600">
                    {activity.activity_date}
                  </p>
                  <span>|</span>
                  {activity.activity_type && (
                    <>
                      <p className="text-xs text-gray-600 capitalize">
                        {formatActivityType(activity.activity_type)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="whitespace-pre-wrap overflow-hidden">
              {activity.activity_location && (
                <p>
                  <strong>Activity Location:</strong>{" "}
                  {activity.activity_location}
                </p>
              )}
              <div className="flex flex-col gap-2 mt-4">
                <h2 className="font-bold text-lg">About the Activity</h2>
                <div className="overflow-y-auto">
                  <p className="text-sm">{activity.activity_description}</p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-center items-center pt-0">
              <p className="flex flex-col items-center">
                {formatDate(activity.created_at)}
                <span className="text-xs text-gray-500">Date Posted</span>
              </p>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
