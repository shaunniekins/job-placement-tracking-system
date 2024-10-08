import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useUsers = (
  rowsPerPage: number,
  currentPage: number,
  userType: string,
  filter?: string
) => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [totalUserEntries, setTotalUserEntries] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    if (!userType) return;
    if (userType !== "agency" && userType !== "alumni") return;

    const offset = (currentPage - 1) * rowsPerPage;

    try {
      let query = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .range(offset, offset + rowsPerPage - 1);

      if (userType) {
        query = query.eq("meta_data->>user_type", userType);

        if (filter) {
          query = query.eq("meta_data->>account_status", filter);
        }
      }

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setUsersData(response.data || []);
      setTotalUserEntries(response.count || 0);
      setIsLoadingUsers(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching users:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, [rowsPerPage, currentPage, userType, filter]);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("farmer_users_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "auth",
          table: "users",
        },
        (payload: any) => {
          const userIndex = usersData.findIndex(
            (user) => user.user_id === payload.new.user_id
          );

          const isMatchingUserType =
            payload.new.meta_data?.user_type === userType;
          const isMatchingFilter =
            !filter || payload.new.meta_data?.account_status === filter;

          if (!isMatchingUserType || !isMatchingFilter) {
            return;
          }

          if (payload.eventType === "INSERT") {
            if (userIndex === -1 && usersData.length < rowsPerPage) {
              setUsersData((prev) => [...prev, payload.new]);
            }
          } else if (payload.eventType === "UPDATE") {
            if (userIndex !== -1) {
              setUsersData((prev) =>
                prev.map((user) =>
                  user.user_id === payload.new.user_id ? payload.new : user
                )
              );
            }
          } else if (payload.eventType === "DELETE") {
            if (userIndex !== -1) {
              setUsersData((prev) =>
                prev.filter((user) => user.user_id !== payload.old.user_id)
              );
            }
          }
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          // console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rowsPerPage, currentPage, userType, filter]);

  useEffect(() => {
    fetchAndSubscribeUsers();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeUsers, subscribeToChanges]);

  return {
    usersData,
    isLoadingUsers,
    totalUserEntries,
    fetchAndSubscribeUsers,
  };
};

export default useUsers;
