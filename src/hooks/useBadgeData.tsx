import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

export const useJobPostingsBadgeData = () => {
  const [totalJobPostingsBadge, setTotalJobPostings] = useState(0);
  const [loadingJobPostings, setLoadingJobPostings] = useState(true);
  const [errorJobPostings, setErrorJobPostings] = useState<string | null>(null);

  const fetchJobPostings = useCallback(async () => {
    setLoadingJobPostings(true);
    setErrorJobPostings(null);

    try {
      let query = supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*", { count: "exact" })
        .eq("job_status", "pending");

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setTotalJobPostings(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorJobPostings(err.message || "Error fetching job postings");
      } else {
        setErrorJobPostings("An unknown error occurred");
      }
    } finally {
      setLoadingJobPostings(false);
    }
  }, []);

  // Set up real-time subscription for INSERT, UPDATE, and DELETE events
  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("job_postings_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "JobPostings",
        },
        async (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (newRecord?.job_status === "pending") {
            if (eventType === "INSERT") {
              setTotalJobPostings((prev) => prev + 1);
            } else if (eventType === "DELETE") {
              setTotalJobPostings((prev) => prev - 1);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setErrorJobPostings("Error subscribing to real-time updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchJobPostings(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchJobPostings, subscribeToChanges]);

  return {
    totalJobPostingsBadge,
    loadingJobPostings,
    errorJobPostings,
    fetchJobPostings,
  };
};

export const useUsersBadgeData = () => {
  const [totalAlumniUsers, setTotalAlumniUsers] = useState<number>(0);
  const [totalAgencyUsers, setTotalAgencyUsers] = useState<number>(0);
  const [totalUsers, setTotalUserEntries] = useState<number>(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const fetchAndSubscribeUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setErrorUsers(null);

    try {
      let query = supabase
        .from("ViewUsers")
        .select("*", { count: "exact" })
        .in("meta_data->>user_type", ["agency", "alumni"])
        .eq("meta_data->>account_status", "pending");

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setTotalUserEntries(response.count || 0);

      const alumniCount = response.data.filter(
        (user: any) => user.meta_data.user_type === "alumni"
      ).length;
      const agencyCount = response.data.filter(
        (user: any) => user.meta_data.user_type === "agency"
      ).length;

      setTotalAlumniUsers(alumniCount);
      setTotalAgencyUsers(agencyCount);
    } catch (err) {
      if (err instanceof Error) {
        setErrorUsers(err.message || "Error fetching users");
      } else {
        setErrorUsers("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

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
          const { eventType, new: newUser, old: oldUser } = payload;
          const isTargetUserType =
            newUser?.meta_data?.user_type === "agency" ||
            newUser?.meta_data?.user_type === "alumni";
          const matchesStatus =
            newUser?.meta_data?.account_status === "pending";

          if (isTargetUserType && matchesStatus) {
            if (eventType === "INSERT") {
              if (newUser.meta_data.user_type === "alumni") {
                setTotalAlumniUsers((prev) => prev + 1);
              } else if (newUser.meta_data.user_type === "agency") {
                setTotalAgencyUsers((prev) => prev + 1);
              }
            } else if (eventType === "DELETE") {
              if (oldUser.meta_data.user_type === "alumni") {
                setTotalAlumniUsers((prev) => prev - 1);
              } else if (oldUser.meta_data.user_type === "agency") {
                setTotalAgencyUsers((prev) => prev - 1);
              }
            }
          }
        }
      )
      .subscribe((status: any) => {
        if (status !== "SUBSCRIBED") {
          setErrorUsers("Error subscribing to real-time updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchAndSubscribeUsers();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchAndSubscribeUsers, subscribeToChanges]);

  return {
    totalAlumniUsers,
    totalAgencyUsers,
    isLoadingUsers,
    errorUsers,
    fetchAndSubscribeUsers,
  };
};
