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
    // Don't fetch if we don't have either ID
    if (
      (!agencyId || agencyId.trim() === "") &&
      (!applicantId || applicantId.trim() === "")
    ) {
      setLoadingJobApplications(false);
      setJobApplications([]);
      setTotalJobApplications(0);
      setErrorJobApplications(null);
      return;
    }

    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingJobApplications(true);
    setErrorJobApplications(null);

    try {
      let query = supabase
        .from("ViewJobApplicationsWithDetails")
        .select("*", { count: "exact" })
        .order("application_date", { ascending: false });

      if (agencyId && agencyId.trim() !== "") {
        query = query.eq("agency_id", agencyId);
      } else if (applicantId && applicantId.trim() !== "") {
        query = query.eq("applicant_id", applicantId);
      } else {
        console.error(
          "Filter error - agencyId:",
          agencyId,
          "applicantId:",
          applicantId
        );
        throw new Error("Either agencyId or applicantId must be provided.");
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
        console.error("Supabase error:", response.error);
        throw response.error;
      }

      setJobApplications(response.data || []);
      setTotalJobApplications(response.count || 0);
    } catch (err) {
      console.error("Error in fetchJobApplications:", err);
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

          // Fetch full details for INSERT/UPDATE using job_application_id
          const fetchFullJobApplication = async (jobApplicationId: number) => {
            if (!jobApplicationId) return null;
            try {
              const { data, error } = await supabase
                .from("ViewJobApplicationsWithDetails")
                .select("*")
                .eq("job_application_id", jobApplicationId)
                .single();
              if (error) throw error;
              return data;
            } catch (err) {
              console.error("Error fetching full job application:", err);
              return null;
            }
          };

          const shouldIncludeApplication = (record: any) => {
            if (!record) return false;
            const matchesAgency = agencyId && record.agency_id === agencyId;
            const matchesApplicant =
              applicantId && record.applicant_id === applicantId;
            const matchesSearch =
              !searchQuery ||
              record.applicant_first_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              record.applicant_last_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              record.job_title
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesProgram =
              !programFilter ||
              programFilter === "all" ||
              record.applicant_program === programFilter;

            return (
              (matchesAgency || matchesApplicant) &&
              matchesSearch &&
              matchesProgram
            );
          };

          switch (eventType) {
            case "INSERT":
              fetchFullJobApplication(newRecord.job_application_id).then(
                (fullApplication) => {
                  if (
                    fullApplication &&
                    shouldIncludeApplication(fullApplication)
                  ) {
                    setJobApplications((prev) => [fullApplication, ...prev]); // Add to start for visibility
                    setTotalJobApplications((prev) => prev + 1);
                  }
                }
              );
              break;
            case "UPDATE":
              fetchFullJobApplication(newRecord.job_application_id).then(
                (fullApplication) => {
                  if (fullApplication) {
                    const included = shouldIncludeApplication(fullApplication);
                    setJobApplications((prev) => {
                      const exists = prev.some(
                        (item) =>
                          item.job_application_id ===
                          newRecord.job_application_id
                      );
                      if (included) {
                        // Update if exists, add if new (due to filter change)
                        return exists
                          ? prev.map((item) =>
                              item.job_application_id ===
                              newRecord.job_application_id
                                ? fullApplication
                                : item
                            )
                          : [fullApplication, ...prev];
                      } else {
                        // Remove if it no longer matches filters
                        return prev.filter(
                          (item) =>
                            item.job_application_id !==
                            newRecord.job_application_id
                        );
                      }
                    });
                    // Adjust total count based on inclusion/exclusion
                    const wasIncluded = jobApplications.some(
                      (app) =>
                        app.job_application_id === newRecord.job_application_id
                    );
                    if (included && !wasIncluded) {
                      setTotalJobApplications((prev) => prev + 1);
                    } else if (!included && wasIncluded) {
                      setTotalJobApplications((prev) => prev - 1);
                    }
                  }
                }
              );
              break;
            case "DELETE":
              const oldAppId = oldRecord?.job_application_id;
              if (oldAppId) {
                setJobApplications((prev) =>
                  prev.filter((item) => item.job_application_id !== oldAppId)
                );
                // Decrement total count cautiously
                setTotalJobApplications((prev) => Math.max(0, prev - 1));
              }
              break;
            default:
              break; // No change for other event types
          }
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
  }, [agencyId, applicantId, programFilter, searchQuery]);

  useEffect(() => {
    fetchJobApplications();
  }, [fetchJobApplications]);

  // Temporarily disable real-time subscription to fix infinite loop
  // TODO: Re-implement real-time subscription with proper dependency management
  // useEffect(() => {
  //   const unsubscribe = subscribeToChanges();
  //   return () => {
  //     if (unsubscribe) unsubscribe();
  //   };
  // }, [subscribeToChanges]);

  return {
    jobApplications,
    totalJobApplications,
    loadingJobApplications,
    errorJobApplications,
    fetchJobApplications,
  };
};

export default useJobApplications;
