"use client";

import { RootState } from "@/app/reduxUtils/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
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
} from "@nextui-org/react";
import {
  HiOutlineMail,
  HiOutlineMailOpen,
  HiOutlineTrash,
} from "react-icons/hi";
import { formatDateSuffix } from "@/utils/compUtils";
import useNotifications from "@/hooks/useNotifications";
import {
  markAllNotificationsAsSeen,
  markNotificationAsSeen,
  deleteNotification,
} from "@/app/api/notificationsIUD";
import { useRouter } from "next/navigation";
import { useNotificationContext } from "@/contexts/NotificationContext";

const NotificationsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 13;
  const router = useRouter();
  const { refreshUnreadCount } = useNotificationContext();

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const {
    notifications,
    totalNotifications,
    loadingNotifications,
    fetchNotifications,
  } = useNotifications(rowsPerPage, page, userId);

  const totalPages = Math.ceil(totalNotifications / rowsPerPage);

  const columns = [
    { key: "message", label: "Message" },
    // { key: "seen", label: "Seen Status" },
    { key: "actions", label: "Actions" },
  ];

  const handleNotificationClick = async (notification: any) => {
    // Mark as seen if not already seen
    if (!notification.seen) {
      await markNotificationAsSeen(
        notification.notification_id,
        notification.seen
      );
      refreshUnreadCount(userId); // Update global context
    }

    // Navigate to URL if present
    if (notification.url) {
      router.push(notification.url);
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Button
          variant="flat"
          startContent={<HiOutlineMailOpen />}
          onClick={async () => {
            await markAllNotificationsAsSeen(userId);
            refreshUnreadCount(userId); // Update global context
          }}
        >
          Mark all as read
        </Button>
        <Pagination
          isCompact
          showControls
          showShadow
          color="default"
          page={page}
          total={totalPages}
          onChange={(newPage) => setPage(newPage)}
        />
      </div>
      <div className="flex h-full w-full overflow-y-auto relative mb-28">
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
                className={`${column.key === "seen" && "lg:w-36"}
                     ${column.key === "message" && "w-32 lg:w-auto"} 
                    bg-[#008B47] text-white text-center whitespace-nowrap flex-nowrap`}
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={notifications}
            emptyContent={"No notifications to display."}
            loadingContent={<Spinner color="success" />}
          >
            {(item) => (
              <TableRow
                key={item.notification_id}
                className={`${
                  !item.seen ? "bg-gray-200" : ""
                } hover:border-3 border-none hover:border-gray-600 hover:shadow-sm text-center ${
                  item.url ? "cursor-pointer" : ""
                }`}
                onClick={() => item.url && handleNotificationClick(item)}
              >
                {(columnKey) => {
                  if (columnKey === "message") {
                    return (
                      <TableCell
                        className={`w-full text-center lg:text-start ${
                          !item.seen && "text-red-800 font-semibold"
                        }`}
                      >
                        <div className="text-gray-500 text-xs">
                          {formatDateSuffix(item.created_at)}
                        </div>
                        <div>{item.message}</div>
                      </TableCell>
                    );
                  }

                  if (columnKey === "actions") {
                    return (
                      <TableCell
                        className="m-0 flex justify-between gap-2"
                        // Stop propagation to prevent row click handling
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          isIconOnly
                          onPress={async () => {
                            await markNotificationAsSeen(
                              item.notification_id,
                              item.seen
                            );
                            refreshUnreadCount(userId); // Update global context
                          }}
                        >
                          {item.seen ? (
                            <HiOutlineMail />
                          ) : (
                            <HiOutlineMailOpen />
                          )}
                        </Button>

                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onPress={async () => {
                            await deleteNotification(item.notification_id);
                            fetchNotifications();
                            refreshUnreadCount(userId); // Update global context
                          }}
                        >
                          <HiOutlineTrash />
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
    </div>
  );
};

export default NotificationsComponent;
