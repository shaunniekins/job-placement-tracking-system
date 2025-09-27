import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useUsers = (
  rowsPerPage: number,
  page: number,
  userType: string,
  statusFilter: string,
  collegeFilter?: string, // Renamed for clarity, represents admin's college for alumni view
  searchInput?: string,
  batchYearFilter?: string,
  programFilter?: string // Added program filter
) => {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [totalUserEntries, setTotalUserEntries] = useState<number>(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);

  const fetchAndSubscribeUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    const offset = (page - 1) * rowsPerPage;

    try {
      let query = supabase.from("ViewUsers").select("*", { count: "exact" });

      // Filter by user type
      if (userType === "agency") {
        query = query.eq("meta_data->>user_type", "agency");
      } else if (userType === "alumni") {
        query = query.eq("meta_data->>user_type", "alumni");
        // Always filter by admin's college if provided for alumni view
        if (collegeFilter && collegeFilter !== "all") {
          // Use ilike for case-insensitive matching
          query = query.ilike("meta_data->>college", collegeFilter);
        }
        // Add program filter if provided
        if (programFilter && programFilter !== "all") {
          // Use ilike for case-insensitive matching if program names might vary in case
          query = query.ilike("meta_data->>program", programFilter);
        }
      } else if (userType === "admin") {
        // Combine admin and program-chair
        query = query.in("meta_data->>user_type", ["admin", "program-chair"]);
        // Filter by college if provided (e.g., for specific admin views if needed later)
        if (collegeFilter && collegeFilter !== "all") {
          // Use ilike for case-insensitive matching
          query = query.ilike("meta_data->>college", collegeFilter);
        }
      }

      // Filter by account status
      if (statusFilter) {
        query = query.eq("meta_data->>account_status", statusFilter);
      }

      // Filter by batch year (only for alumni)
      if (
        userType === "alumni" &&
        batchYearFilter &&
        batchYearFilter !== "all"
      ) {
        // Ensure we're filtering correctly by comparing as strings
        query = query.eq("meta_data->>batch_year", batchYearFilter.toString());
      }

      // Search filter
      if (searchInput) {
        if (userType === "agency") {
          query = query.ilike("meta_data->>company_name", `%${searchInput}%`);
        } else if (userType === "alumni" || userType === "admin") {
          // Search by first name or last name
          query = query.or(
            `meta_data->>first_name.ilike.%${searchInput}%,meta_data->>last_name.ilike.%${searchInput}%`
          );
        }
      }

      // Pagination
      query = query.range(offset, offset + rowsPerPage - 1);

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        console.error("Error fetching users:", response.error);
        throw response.error;
      }

      setUsersData(response.data || []);
      setTotalUserEntries(response.count || 0);
    } catch (error) {
      console.error("An error occurred:", error);
      setUsersData([]);
      setTotalUserEntries(0);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [
    rowsPerPage,
    page,
    userType,
    statusFilter,
    collegeFilter,
    searchInput,
    batchYearFilter,
    programFilter, // Add programFilter to dependency array
  ]);

  useEffect(() => {
    fetchAndSubscribeUsers();

    const channel = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "auth", table: "users" },
        (payload) => {
          fetchAndSubscribeUsers(); // Refetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAndSubscribeUsers]); // fetchAndSubscribeUsers is now stable due to useCallback

  return {
    usersData,
    totalUserEntries,
    isLoadingUsers,
    fetchAndSubscribeUsers,
  };
};

export default useUsers;
