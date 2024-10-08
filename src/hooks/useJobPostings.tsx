import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useJobPostings = (
  rowsPerPage: number,
  currentPage: number,
  agencyId?: string,
  jobStatusFilter?: string
) => {
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [totalJobPostings, setTotalJobPostings] = useState(0);
  const [loadingJobPostings, setLoadingJobPostings] = useState(true);
  const [errorJobPostings, setErrorJobPostings] = useState<string | null>(null);

  const fetchJobPostings = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingJobPostings(true);
    setErrorJobPostings(null);

    try {
      let query = supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*", { count: "exact" })
        .order("date_posted", { ascending: true });

      if (agencyId) {
        query = query.eq("agency_id", agencyId);
      }

      if (jobStatusFilter) {
        query = query.eq("job_status", jobStatusFilter);
      }

      const response: PostgrestResponse<any> = await query.range(
        offset,
        offset + rowsPerPage - 1
      );

      if (response.error) {
        throw response.error;
      }

      setJobPostings(response.data || []);
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
  }, [rowsPerPage, currentPage, agencyId, jobStatusFilter]);

  const fetchFullJobPosting = async (jobPostingId: number) => {
    if (!jobPostingId) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*")
        .eq("job_posting_id", jobPostingId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching full job posting:", err);
      return null;
    }
  };

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
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          switch (eventType) {
            case "INSERT":
              if (
                (!agencyId || newRecord.agency_id === agencyId) &&
                (!jobStatusFilter || newRecord.job_status === jobStatusFilter)
              ) {
                const fullJobPosting = await fetchFullJobPosting(
                  newRecord.job_posting_id
                );
                if (fullJobPosting) {
                  setJobPostings((prev) => [...prev, fullJobPosting]);
                }
              }
              break;
            case "UPDATE":
              if (
                (!agencyId || newRecord.agency_id === agencyId) &&
                (!jobStatusFilter || newRecord.job_status === jobStatusFilter)
              ) {
                const fullJobPosting = await fetchFullJobPosting(
                  newRecord.job_posting_id
                );
                if (fullJobPosting) {
                  setJobPostings((prev) =>
                    prev.map((item) =>
                      item.job_posting_id === newRecord.job_posting_id
                        ? fullJobPosting
                        : item
                    )
                  );
                }
              } else {
                // Remove the job posting if it no longer matches the filter
                setJobPostings((prev) =>
                  prev.filter(
                    (item) => item.job_posting_id !== newRecord.job_posting_id
                  )
                );
              }
              break;
            case "DELETE":
              setJobPostings((prev) =>
                prev.filter(
                  (item) => item.job_posting_id !== oldRecord.job_posting_id
                )
              );
              break;
            default:
              break;
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
  }, [agencyId, jobStatusFilter]);

  useEffect(() => {
    fetchJobPostings(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchJobPostings, subscribeToChanges]);

  return {
    jobPostings,
    totalJobPostings,
    loadingJobPostings,
    errorJobPostings,
    fetchJobPostings,
  };
};

export default useJobPostings;
