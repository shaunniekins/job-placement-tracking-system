import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import { insertNotification } from "@/app/api/notificationsIUD";

const useJobPostingsForAgency = (
  rowsPerPage: number,
  currentPage: number,
  agencyId: string
) => {
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const [totalJobPostings, setTotalJobPostings] = useState(0);
  const [loadingJobPostings, setLoadingJobPostings] = useState(true);
  const [errorJobPostings, setErrorJobPostings] = useState<string | null>(null);

  const fetchJobPostings = useCallback(async () => {
    if (!agencyId) return;

    const offset = (currentPage - 1) * rowsPerPage;

    try {
      let query = supabase
        .from("ViewJobPostingsWithAgencyDetails")
        .select("*", { count: "exact" })
        .order("date_posted", { ascending: false });

      if (agencyId) {
        query = query.eq("agency_id", agencyId);
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
  }, [rowsPerPage, currentPage, agencyId]);

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
            return !agencyId || record.agency_id === agencyId;
          };

          // Check if accepted applicants reached the required number
          if (
            eventType === "UPDATE" &&
            newRecord.accepted_applicants >= newRecord.number_of_applicants
          ) {
            // Close the job posting
            await supabase
              .from("JobPostings")
              .update({ job_status: "closed" })
              .eq("job_posting_id", newRecord.job_posting_id);

            // Send notification to agency
            const message = `Job posting "${newRecord.job_title}" has been automatically closed as the required number of applicants (${newRecord.number_of_applicants}) has been reached.`;

            await insertNotification({
              receiver_id: newRecord.agency_id,
              message: message,
            });

            // Send SMS notification
            const { data: agencyData }: { data: any } = await supabase
              .from("users")
              .select("raw_user_meta_data->contact_number as phone")
              .eq("id", newRecord.agency_id)
              .single();

            if (agencyData?.phone) {
              await fetch("/api/send-sms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  phone: agencyData.phone,
                  message: message,
                }),
              });
            }
          }

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
  }, [agencyId]);

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

export default useJobPostingsForAgency;
