"use client";

import { RootState } from "@/app/reduxUtils/store";
import useJobApplications from "@/hooks/useJobApplications";
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
  SelectItem,
  Select,
} from "@nextui-org/react";
import { formatDate, formatDateSuffix } from "@/utils/compUtils";
import useNotifications from "@/hooks/useNotifications";

const NotificationsComponent = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 15;

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  const {
    notifications,
    totalNotifications,
    loadingNotifications,
    errorNotifications,
  } = useNotifications(rowsPerPage, page, userId);

  const totalPages = Math.ceil(totalNotifications / rowsPerPage);

  if (loadingNotifications) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <Spinner color="success" />
      </div>
    );
  }

  const columns = [
    { key: "message", label: "Message" },
    { key: "created_at", label: "Date" },
  ];

  return (
    <div className="h-full w-full flex flex-col gap-2">
      <div
        className={`${
          notifications.length === 0 ? "justify-end" : "justify-between"
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
          className={`${notifications.length === 0 && "hidden"}`}
        />
        <Button className="invisible" />
      </div>
      <div className="flex h-full w-full overflow-y-auto relative">
        {notifications.length === 0 && (
          <div className="h-full w-full flex justify-center items-center -mt-16">
            <p>No new notifications yet.</p>
          </div>
        )}

        {notifications && notifications.length > 0 && (
          <div className="h-full">
            <Table
              fullWidth
              layout="fixed"
              isHeaderSticky={true}
              aria-label="Job Applications Table"
              classNames={{
                wrapper: "h-full bg-[#F4FFFC] border-2 border-[#007057]",
              }}
              className="h-full w-full flex items-center justify-center"
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.key}
                    className="bg-[#007057] text-white text-center whitespace-nowrap flex-nowrap"
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
                    className="text-center hover:bg-green-100"
                  >
                    {(columnKey) => {
                      if (columnKey === "created_at") {
                        return (
                          <TableCell className="text-center">
                            {formatDateSuffix(item.created_at)}
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
  );
};

export default NotificationsComponent;
