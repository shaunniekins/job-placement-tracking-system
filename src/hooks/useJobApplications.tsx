import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useJobApplications = (
  rowsPerPage: number,
  currentPage: number,
  agencyId?: string,
  applicantId?: string,
  searchQuery?: string,
  programFilter?: string
) => {
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [totalJobApplications, setTotalJobApplications] = useState(0);
  const [loadingJobApplications, setLoadingJobApplications] = useState(true);
  const [errorJobApplications, setErrorJobApplications] = useState<
    string | null
  >(null);

  const fetchJobApplications = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingJobApplications(true);
    setErrorJobApplications(null);

    try {
      let query = supabase
        .from("ViewJobApplicationsWithDetails")
        .select("*", { count: "exact" })
        .order("date_posted", { ascending: true });

      if (agencyId && !applicantId) {
        query = query.eq("agency_id", agencyId);
      } else if (applicantId && !agencyId) {
        query = query.eq("applicant_id", applicantId);
      } else {
        throw new Error(
          "Either agencyId or applicantId must be provided, but not both."
        );
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(
          `applicant_first_name.ilike.%${searchQuery}%,applicant_last_name.ilike.%${searchQuery}%,job_title.ilike.%${searchQuery}%`
        );
      }

      // Apply program filter
      if (programFilter !== "all" && programFilter) {
        query = query.eq("applicant_program", programFilter);
      }

      const response: PostgrestResponse<any> = await query.range(
        offset,
        offset + rowsPerPage - 1
      );

      if (response.error) {
        throw response.error;
      }

      setJobApplications(response.data || []);
      setTotalJobApplications(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorJobApplications(err.message || "Error fetching job postings");
      } else {
        setErrorJobApplications("An unknown error occurred");
      }
    } finally {
      setLoadingJobApplications(false);
    }
  }, [
    rowsPerPage,
    currentPage,
    agencyId,
    applicantId,
    searchQuery,
    programFilter,
  ]);

  const fetchFullJobPosting = async (jobPostingId: number) => {
    if (!jobPostingId) {
      return null;
    }

    // i think instead of job_posting_id, it should be job_application_id
    // double check this
    try {
      const { data, error } = await supabase
        .from("ViewJobApplicationsWithDetails")
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
      .channel("job_applications_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "JobApplications",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setJobApplications((prev) => {
            switch (eventType) {
              case "INSERT":
                if (
                  (agencyId && newRecord.agency_id === agencyId) ||
                  (applicantId && newRecord.applicant_id === applicantId)
                ) {
                  fetchFullJobPosting(newRecord.job_posting_id).then(
                    (fullJobPosting) => {
                      if (fullJobPosting) {
                        setJobApplications([...prev, fullJobPosting]);
                      }
                    }
                  );
                }
                break;
              case "UPDATE":
                fetchFullJobPosting(newRecord.job_posting_id).then(
                  (fullJobPosting) => {
                    if (fullJobPosting) {
                      setJobApplications(
                        prev.map((item) =>
                          item.job_posting_id === newRecord.job_posting_id
                            ? fullJobPosting
                            : item
                        )
                      );
                    }
                  }
                );
                break;
              case "DELETE":
                return prev.filter(
                  (message) =>
                    message.job_posting_id !== oldRecord.job_posting_id
                );
              default:
                return prev;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setErrorJobApplications("Error subscribing to real-time updates");
          // console.error("Error subscribing to channel:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, applicantId]);

  useEffect(() => {
    fetchJobApplications(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchJobApplications, subscribeToChanges]);

  return {
    jobApplications,
    totalJobApplications,
    loadingJobApplications,
    errorJobApplications,
    fetchJobApplications,
  };
};

export default useJobApplications;
