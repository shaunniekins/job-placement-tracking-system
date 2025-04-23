import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useJobPostings = (
  rowsPerPage: number,
  currentPage: number,
  agencyId?: string,
  jobStatusFilter?: string,
  userProgram?: string,
  searchFilter?: string
) => {
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [totalJobPostings, setTotalJobPostings] = useState(0);
  const [loadingJobPostings, setLoadingJobPostings] = useState(true);
  const [errorJobPostings, setErrorJobPostings] = useState<string | null>(null);

  const fetchJobPostings = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;

    try {
      let query = supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*", { count: "exact" })
        .order("date_posted", { ascending: false });

      if (agencyId) {
        query = query.eq("agency_id", agencyId);
      }

      if (jobStatusFilter) {
        query = query.eq("job_status", jobStatusFilter);
      }

      if (userProgram) {
        query = query.or(`programs.cs.{${userProgram}},programs.is.null`);
      }

      if (searchFilter) {
        query = query.or(
          `job_title.ilike.%${searchFilter}%,agency_company_name.ilike.%${searchFilter}%`
        );
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
  }, [
    rowsPerPage,
    currentPage,
    agencyId,
    jobStatusFilter,
    userProgram,
    searchFilter,
  ]);

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

          const shouldIncludeJob = (record: any) => {
            const programsMatch =
              !userProgram ||
              !record.programs ||
              record.programs.includes(userProgram);

            const filterMatch =
              !jobStatusFilter || record.job_status === jobStatusFilter;

            const agencyMatch = !agencyId || record.agency_id === agencyId;

            const searchMatch =
              !searchFilter ||
              record.job_title
                .toLowerCase()
                .includes(searchFilter.toLowerCase()) ||
              record.agency_company_name
                .toLowerCase()
                .includes(searchFilter.toLowerCase());

            return programsMatch && filterMatch && agencyMatch && searchMatch;
          };

          switch (eventType) {
            case "INSERT":
              if (shouldIncludeJob(newRecord)) {
                const fullJobPosting = await fetchFullJobPosting(
                  newRecord.job_posting_id
                );
                if (fullJobPosting) {
                  setJobPostings((prev) => [...prev, fullJobPosting]);
                }
              }
              break;
            case "UPDATE":
              if (shouldIncludeJob(newRecord)) {
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
                setJobPostings((prev) =>
                  prev.filter(
                    (item) => item.job_posting_id !== newRecord.job_posting_id
                  )
                );
              }
              break;
            case "DELETE":
              const oldJPId = oldRecord?.job_posting_id;
              if (oldJPId) {
                setJobPostings((prev) =>
                  prev.filter((item) => item.job_posting_id !== oldJPId)
                );
                // Decrement total count cautiously
                setTotalJobPostings((prev) => Math.max(0, prev - 1));
              }
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
  }, [agencyId, jobStatusFilter, userProgram, searchFilter]);

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
