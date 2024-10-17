"use client";

import {
  deleteActivity,
  insertActivity,
  updateActivity,
} from "@/app/api/activitiesIUD";
import { RootState } from "@/app/reduxUtils/store";
import useActivities from "@/hooks/useActivities";
import { capitalizeFirstLetter, formatDate } from "@/utils/compUtils";
import { parseDate } from "@internationalized/date";
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
  Select,
  SelectItem,
  DateInput,
  DateValue,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoMdTrash } from "react-icons/io";
import { IoAddCircleSharp } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { useSelector } from "react-redux";

interface ActivityForm {
  activity_title: string;
  activity_type: string;
  activity_description: string;
  activity_location: string;
  activity_date: DateValue | null;
}

const ManageActivities = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<"insert" | "update">("insert");
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const [openPopoverActivityId, setOpenPopoverActivityId] = useState<
    string | null
  >(null);

  const togglePopover = (activityId: string) => {
    if (openPopoverActivityId === activityId) {
      setOpenPopoverActivityId(null);
    } else {
      setOpenPopoverActivityId(activityId);
    }
  };

  // Form state for activity posting
  const [activityForm, setActivityForm] = useState<ActivityForm>({
    activity_title: "",
    activity_type: "",
    activity_description: "",
    activity_location: "",
    activity_date: null,
  });

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const { activities, totalActivities, loadingActivities } = useActivities(
    rowsPerPage,
    page
  );

  const totalPages = Math.ceil(totalActivities / rowsPerPage);

  const handleModalOpen = (type: "insert" | "update", activity?: any) => {
    setModalType(type);
    setOpenModal(true);
    setOpenPopoverActivityId(null);
    if (type === "update" && activity) {
      setSelectedActivity(activity);
      setActivityForm({
        activity_title: activity.activity_title,
        activity_type: activity.activity_type,
        activity_description: activity.activity_description,
        activity_location: activity.activity_location,
        activity_date: parseDate(activity.activity_date),
      });
    } else {
      // Reset form for insert
      setActivityForm({
        activity_title: "",
        activity_type: "",
        activity_description: "",
        activity_location: "",
        activity_date: null,
      });
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setActivityForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleDateChange = (value: DateValue | null) => {
    setActivityForm((prevForm) => ({
      ...prevForm,
      activity_date: value,
    }));
  };

  const handleSubmit = async () => {
    // Convert activity_date to a string in the format YYYY-MM-DD
    const formattedActivityForm = {
      ...activityForm,

      activity_date: activityForm.activity_date
        ? activityForm.activity_date.toString()
        : null,
    };

    try {
      if (modalType === "insert") {
        await insertActivity(formattedActivityForm);
      } else if (modalType === "update" && selectedActivity) {
        await updateActivity(
          selectedActivity.activity_id,
          formattedActivityForm
        );
      }
      setOpenModal(false);
    } catch (error) {
      console.error("Error submitting activity:", error);
    }
  };

  if (loadingActivities) {
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
                  ? "Create Activity Posting"
                  : "Update Activity Posting"}
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Input
                    label="Activity Title"
                    placeholder="Enter activity title"
                    name="activity_title"
                    value={activityForm.activity_title}
                    onChange={handleInputChange}
                    className="col-span-2"
                  />
                  <Select
                    label="Activity Type"
                    placeholder="Select activity type"
                    name="activity_type"
                    value={activityForm.activity_type}
                    onChange={handleInputChange}
                    className="col-span-2"
                  >
                    <SelectItem key={"event"} value={"event"}>
                      Event
                    </SelectItem>
                    <SelectItem key={"job_fair"} value={"job"}>
                      Job Fair
                    </SelectItem>
                  </Select>
                  <Input
                    label="Activity Location"
                    placeholder="Enter activity location"
                    name="activity_location"
                    value={activityForm.activity_location}
                    onChange={handleInputChange}
                    className="col-span-2 md:col-span-1"
                  />
                  <DateInput
                    label="Activity Date"
                    // placeholder="Enter activity date"
                    name="activity_date"
                    value={activityForm.activity_date}
                    onChange={handleDateChange}
                    className="col-span-2 md:col-span-1"
                  />
                  <Textarea
                    label="Activity Description"
                    placeholder="Enter activity description"
                    name="activity_description"
                    value={activityForm.activity_description}
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
                    !activityForm.activity_title ||
                    !activityForm.activity_type ||
                    !activityForm.activity_date ||
                    !activityForm.activity_description
                  }
                  onClick={handleSubmit}
                >
                  {modalType === "insert"
                    ? "Create Activity"
                    : "Update Activity"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="h-full w-full flex flex-col gap-2">
        <div
          className={`${
            activities.length === 0 ? "justify-end" : "justify-between"
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
            className={`${activities.length === 0 && "hidden"}`}
          />
          <Button
            startContent={<IoAddCircleSharp size={20} />}
            onClick={() => handleModalOpen("insert")}
          >
            Create New
          </Button>
        </div>
        <div className="flex-1 w-full overflow-y-auto relative">
          {activities.length === 0 && (
            <div className="h-full w-full flex justify-center items-center -mt-16">
              <p>No activity postings yet.</p>
            </div>
          )}

          {activities && activities.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-24">
              {activities.map((activity) => (
                <ActivityDetails
                  key={activity.activity_id}
                  activity={activity}
                  openPopoverActivityId={openPopoverActivityId}
                  togglePopover={togglePopover}
                  onEdit={() => handleModalOpen("update", activity)}
                  onDelete={() => {
                    setOpenPopoverActivityId(null);
                    deleteActivity(activity.activity_id);
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

const ActivityDetails = ({
  activity,
  openPopoverActivityId,
  togglePopover,
  onEdit,
  onDelete,
}: {
  activity: any;
  openPopoverActivityId: string | null;
  togglePopover: (activityId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold">{activity.activity_title}</h2>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-gray-600">{activity.activity_date}</p>
            <span>|</span>
            {activity.activity_type && (
              <>
                <p className="text-xs text-gray-600">
                  {activity.activity_type}
                </p>
              </>
            )}
          </div>
        </div>
        <Popover
          placement="bottom"
          isOpen={openPopoverActivityId === activity.activity_id}
          onOpenChange={() => togglePopover(activity.activity_id)}
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
        {activity.activity_location && (
          <p>
            <strong>Activity Location:</strong> {activity.activity_location}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          <h2 className="font-bold text-lg">About the Activity</h2>
          <div className="overflow-y-auto">
            <p className="text-sm">{activity.activity_description}</p>
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex justify-center items-center pt-0">
        <p className="flex flex-col items-center">
          {formatDate(activity.created_at)}
          <span className="text-xs text-gray-500">Date Posted</span>
        </p>
      </CardFooter>
    </Card>
  );
};

export default ManageActivities;
