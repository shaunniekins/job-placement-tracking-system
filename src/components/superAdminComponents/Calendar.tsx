"use client";

import { useEffect, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import {
  Spinner,
  Modal,
  Button,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalContent,
  Chip,
} from "@nextui-org/react";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core/index.js";
import { formatDate } from "@/utils/compUtils";
import useCalendarEvents from "@/hooks/useCalendarEvents";

// Define the type for the event object
interface EventProps {
  id: string;
  title: string;
  start: Date;
  type: "activity" | "job_posting";
  extendedProps: {
    description: string;
    location?: string;
    jobType?: string;
    salary?: string;
    industry?: string;
    agency?: string;
    requirements?: string[];
    applicationDeadline?: string;
  };
}

const CalendarComponent = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>("");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Use our new hook with date range
  const { events, loading } = useCalendarEvents(dateRange.start, dateRange.end);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventType = clickInfo.event.extendedProps.type || "activity";

    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: clickInfo.event.start!,
      type: eventType,
      extendedProps: {
        description: clickInfo.event.extendedProps.description || "",
        location: clickInfo.event.extendedProps.location,
        jobType: clickInfo.event.extendedProps.jobType,
        salary: clickInfo.event.extendedProps.salary,
        industry: clickInfo.event.extendedProps.industry,
        agency: clickInfo.event.extendedProps.agency,
        requirements: clickInfo.event.extendedProps.requirements,
        applicationDeadline: clickInfo.event.extendedProps.applicationDeadline,
      },
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const start = arg.view.currentStart;
    const end = arg.view.currentEnd;

    // Format dates to YYYY-MM-DD
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setDateRange({ start: startStr, end: endStr });

    // Set current month for display purposes
    const month = start.toLocaleString("default", { month: "long" });
    setCurrentMonth(month);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        height="100%"
        eventContent={(eventInfo) => {
          const eventType = eventInfo.event.extendedProps.type || "activity";
          return (
            <div
              className={`w-full p-1 ${
                eventType === "activity" ? "bg-green-300" : "bg-blue-300"
              } rounded`}
            >
              <div className="text-xs font-bold truncate">
                {eventInfo.event.title}
              </div>
            </div>
          );
        }}
      />

      {selectedEvent && (
        <Modal size="xl" isOpen={isModalOpen} onClose={closeModal}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <div className="flex flex-col">
                    <h4>{selectedEvent.title}</h4>
                    <Chip
                      size="sm"
                      color={
                        selectedEvent.type === "activity"
                          ? "success"
                          : "primary"
                      }
                    >
                      {selectedEvent.type === "activity"
                        ? "Activity"
                        : "Job Posting"}
                    </Chip>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <h5>
                    <b>Date:</b>{" "}
                    {formatDate(
                      selectedEvent.start.toISOString().split("T")[0]
                    )}
                  </h5>

                  {selectedEvent.type === "activity" &&
                    selectedEvent.extendedProps.location && (
                      <h5>
                        <b>Location:</b> {selectedEvent.extendedProps.location}
                      </h5>
                    )}

                  {selectedEvent.type === "job_posting" && (
                    <>
                      {selectedEvent.extendedProps.agency && (
                        <h5>
                          <b>Agency:</b> {selectedEvent.extendedProps.agency}
                        </h5>
                      )}
                      {selectedEvent.extendedProps.jobType && (
                        <h5>
                          <b>Job Type:</b> {selectedEvent.extendedProps.jobType}
                        </h5>
                      )}
                      {selectedEvent.extendedProps.industry && (
                        <h5>
                          <b>Industry:</b>{" "}
                          {selectedEvent.extendedProps.industry}
                        </h5>
                      )}
                      {selectedEvent.extendedProps.salary && (
                        <h5>
                          <b>Salary Range:</b>{" "}
                          {selectedEvent.extendedProps.salary}
                        </h5>
                      )}
                      {selectedEvent.extendedProps.applicationDeadline && (
                        <h5>
                          <b>Application Deadline:</b>{" "}
                          {formatDate(
                            selectedEvent.extendedProps.applicationDeadline
                          )}
                        </h5>
                      )}
                      {selectedEvent.extendedProps.requirements &&
                        Array.isArray(
                          selectedEvent.extendedProps.requirements
                        ) &&
                        selectedEvent.extendedProps.requirements.length > 0 && (
                          <div>
                            <b>Requirements:</b>
                            <ul className="list-disc ml-5">
                              {selectedEvent.extendedProps.requirements.map(
                                (req, index) => (
                                  <li key={index}>{req}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </>
                  )}

                  {/* <hr className="my-2" /> */}
                  <div className="h-32 overflow-y-auto">
                    <b>Description:</b>
                    <br />
                    <span>{selectedEvent.extendedProps.description}</span>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button size="sm" color="warning" onClick={closeModal}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default CalendarComponent;
