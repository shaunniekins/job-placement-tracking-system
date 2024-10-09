"use client";

import useActivities from "@/hooks/useActivities";
import { useEffect, useState } from "react";
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
} from "@nextui-org/react";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core/index.js";
import { formatDate } from "@/utils/compUtils";

// Define the type for the event object
interface EventProps {
  title: string;
  start: Date;
  extendedProps: {
    description: string;
    location: string;
  };
}

const CalendarComponent = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 600;
  const [selectedEvent, setSelectedEvent] = useState<EventProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  const { activities, loadingActivities } = useActivities(rowsPerPage, page);

  // Format activities data to FullCalendar's event format
  const events = activities.map((activity) => ({
    title: activity.activity_title,
    start: new Date(activity.activity_date + "T00:00:00"),
    extendedProps: {
      description: activity.activity_description,
      location: activity.activity_location,
    },
  }));

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      title: clickInfo.event.title,
      start: clickInfo.event.start!,
      extendedProps: {
        description: clickInfo.event.extendedProps.description,
        location: clickInfo.event.extendedProps.location,
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
    const month = start.toLocaleString("default", { month: "long" });
    setCurrentMonth(month);
  };

  if (loadingActivities) {
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
          return <i className="bg-green-300 w-full">{eventInfo.event.title}</i>;
        }}
      />

      {selectedEvent && (
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader>
                  <h4>{selectedEvent.title}</h4>
                </ModalHeader>
                <ModalBody>
                  <h5>
                    <b>Date:</b>{" "}
                    {formatDate(
                      selectedEvent.start.toISOString().split("T")[0]
                    )}
                  </h5>
                  {selectedEvent.extendedProps.location && (
                    <h5>
                      <b>Location:</b> {selectedEvent.extendedProps.location}
                    </h5>
                  )}
                  <hr />
                  <div className="h-56 overflow-y-auto">
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
