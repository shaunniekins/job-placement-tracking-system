import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import { useNotificationContext } from "@/contexts/NotificationContext";

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

  // Use the global notification context
  const { refreshUnreadCount } = useNotificationContext();

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
    if (!userId) return () => {};

    console.log(`[useNotifications] Setting up subscription for ${userId}`);

    // Create a unique channel name for this user to avoid conflicts
    const channelName = `notifications_user_${userId}_${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notifications",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          console.log(
            `[useNotifications] Change detected: ${eventType}`,
            payload
          );

          // Update notifications list
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

          // Update global unread count
          await refreshUnreadCount(userId);
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.error(`[useNotifications] Failed to subscribe: ${status}`);
        } else {
          console.log(`[useNotifications] Successfully subscribed: ${status}`);
        }
      });

    return () => {
      console.log(`[useNotifications] Cleaning up subscription for ${userId}`);
      supabase.removeChannel(channel);
    };
  }, [userId, refreshUnreadCount]);

  // Reset state when userId changes
  useEffect(() => {
    if (!userId) return;

    // Refresh unread count when userId changes
    refreshUnreadCount(userId);
  }, [userId, refreshUnreadCount]);

  // Initial data fetch and subscription
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();
    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchNotifications, subscribeToChanges, userId]);

  return {
    notifications,
    totalNotifications,
    loadingNotifications,
    errorNotifications,
    fetchNotifications,
    refreshUnreadCount: () => refreshUnreadCount(userId),
  };
};

export default useNotifications;
