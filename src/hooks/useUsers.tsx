import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useUsers = (
  rowsPerPage: number,
  currentPage: number,
  userType: string,
  accountStatusfilter?: string,
  collegeFilter?: string,
  searchQuery?: string,
  batchYearFilter?: string
) => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [totalUserEntries, setTotalUserEntries] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    if (!userType) return;
    if (userType !== "agency" && userType !== "alumni" && userType !== "admin")
      return;

    const offset = (currentPage - 1) * rowsPerPage;

    try {
      let query = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .range(offset, offset + rowsPerPage - 1);

      if (userType) {
        query = query.eq("meta_data->>user_type", userType);

        if (accountStatusfilter) {
          query = query.eq("meta_data->>account_status", accountStatusfilter);
        }

        if (userType === "admin" || userType === "alumni") {
          if (collegeFilter && collegeFilter !== "all") {
            query = query.eq("meta_data->>college", collegeFilter);
          }

          if (
            batchYearFilter &&
            batchYearFilter !== "All" &&
            batchYearFilter.length === 4
          ) {
            query = query.eq("meta_data->>batch_year", batchYearFilter);
          }
        }

        if (searchQuery) {
          query = query.or(
            `meta_data->>email.ilike.%${searchQuery}%,meta_data->>company_name.ilike.%${searchQuery}%,meta_data->>company_type.ilike.%${searchQuery}%,meta_data->>first_name.ilike.%${searchQuery}%,meta_data->>last_name.ilike.%${searchQuery}%`
          );
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
  }, [
    rowsPerPage,
    currentPage,
    userType,
    accountStatusfilter,
    collegeFilter,
    searchQuery,
    batchYearFilter,
  ]);

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
            !accountStatusfilter ||
            payload.new.meta_data?.account_status === accountStatusfilter;

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
  }, [
    rowsPerPage,
    currentPage,
    userType,
    accountStatusfilter,
    collegeFilter,
    searchQuery,
    batchYearFilter,
  ]);

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
