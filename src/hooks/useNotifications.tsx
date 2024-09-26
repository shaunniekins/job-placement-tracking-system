import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useNotifications = (
  rowsPerPage: number,
  currentPage: number,
  userId: string
) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(
    null
  );

  const fetchNotifications = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingNotifications(true);
    setErrorNotifications(null);

    try {
      if (!userId) return;

      let query = supabase
        .from("Notifications")
        .select("*", { count: "exact" })
        .eq("receiver_id", userId)
        .order("created_at", { ascending: false });

      const response: PostgrestResponse<any> = await query.range(
        offset,
        offset + rowsPerPage - 1
      );

      if (response.error) {
        throw response.error;
      }

      setNotifications(response.data || []);
      setTotalNotifications(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorNotifications(err.message || "Error fetching notifications");
      } else {
        setErrorNotifications("An unknown error occurred");
      }
    } finally {
      setLoadingNotifications(false);
    }
  }, [rowsPerPage, currentPage, userId]);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("notifications_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setNotifications((prevNotifications) => {
            switch (eventType) {
              case "INSERT":
                return [newRecord, ...prevNotifications];
              case "DELETE":
                return prevNotifications.filter(
                  (notification) =>
                    notification.notification_id !== oldRecord.notification_id
                );
              case "UPDATE":
                return prevNotifications.map((notification) =>
                  notification.notification_id === newRecord.notification_id
                    ? newRecord
                    : notification
                );
              default:
                return prevNotifications;
            }
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setErrorNotifications("Error subscribing to real-time updates");
          // console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [subscribeToChanges]);

  return {
    notifications,
    totalNotifications,
    loadingNotifications,
    errorNotifications,
  };
};

export default useNotifications;
