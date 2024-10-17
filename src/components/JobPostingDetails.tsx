import { capitalizeFirstLetter, formatDate } from "@/utils/compUtils";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoMdTrash } from "react-icons/io";
import { MdOutlineEdit } from "react-icons/md";

export const JobPostingDetails = ({
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
          <div className="overflow-y-auto">
            <p className="p text-sm">{job.job_description}</p>
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex justify-between items-center pt-0">
        <p>{formatDate(job.date_posted)}</p>
        <Button
          color={`${
            job.job_status === "approved"
              ? "success"
              : job.job_status === "inactive"
              ? "danger"
              : "default"
          }`}
          isDisabled
        >
          {capitalizeFirstLetter(job.job_status)}
        </Button>
      </CardFooter>
    </Card>
  );
};
