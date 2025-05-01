"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/utils/supabase";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: (userId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async (userId: string) => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from("Notifications")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .eq("seen", false);

      if (error) throw error;

      console.log(`[NotificationContext] Unread count: ${count}`);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      setUnreadCount(0);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
