import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";
import { insertNotification } from "@/app/api/notificationsIUD";
import { updateJobPosting } from "@/app/api/jobPostingsIUD"; // Import update function

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

  const fetchFullJobPosting = useCallback(async (jobPostingId: number) => {
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
  }, []); // Empty dependency array as it only uses supabase

  // Set up real-time subscription for INSERT, UPDATE, and DELETE events
  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("job_postings_agency_sessions") // Use a unique channel name if needed
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
            return record && agencyId && record.agency_id === agencyId;
          };

          // Check if accepted applicants reached the required number on UPDATE
          if (
            eventType === "UPDATE" &&
            newRecord &&
            shouldIncludeJob(newRecord) &&
            newRecord.job_status !== "closed" &&
            newRecord.number_of_applicants > 0 &&
            newRecord.accepted_applicants >= newRecord.number_of_applicants
          ) {
            // console.log(
            //   `Job posting ${newRecord.job_posting_id} met applicant criteria. Closing...`
            // );
            // Close the job posting
            const updateResult = await updateJobPosting(
              newRecord.job_posting_id,
              {
                job_status: "closed",
              }
            );

            if (updateResult) {
              // console.log(
              //   `Job posting ${newRecord.job_posting_id} closed successfully.`
              // );
              // Send notification to agency
              const message = `Job posting "${newRecord.job_title}" has been automatically closed as the required number of applicants (${newRecord.number_of_applicants}) has been reached.`;

              await insertNotification({
                receiver_id: newRecord.agency_id,
                message: message,
              });

              // Send SMS notification
              const { data: agencyData }: { data: any } = await supabase
                .from("auth.users")
                .select("raw_user_meta_data->>'contact_number' as phone")
                .eq("id", newRecord.agency_id)
                .single();

              if (agencyData?.phone) {
                try {
                  await fetch("/api/send-sms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      phone: agencyData.phone,
                      message: message,
                    }),
                  });
                } catch (smsError) {
                  console.error("Failed to send SMS:", smsError);
                }
              }

              // Update local state immediately to reflect the change
              setJobPostings((prev) =>
                prev.map((item) =>
                  item.job_posting_id === newRecord.job_posting_id
                    ? { ...item, job_status: "closed" }
                    : item
                )
              );
            } else {
              console.error(
                `Failed to close job posting ${newRecord.job_posting_id}.`
              );
            }
          } else {
            // Handle regular INSERT, UPDATE, DELETE for UI consistency
            switch (eventType) {
              case "INSERT":
                if (shouldIncludeJob(newRecord)) {
                  const fullJobPosting = await fetchFullJobPosting(
                    newRecord.job_posting_id
                  );
                  if (fullJobPosting) {
                    setJobPostings((prev) => [fullJobPosting, ...prev]);
                    setTotalJobPostings((prev) => prev + 1);
                  }
                }
                break;
              case "UPDATE":
                const jobExists = jobPostings.some(
                  (item) => item.job_posting_id === newRecord.job_posting_id
                );

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
                } else if (jobExists) {
                  setJobPostings((prev) =>
                    prev.filter(
                      (item) => item.job_posting_id !== newRecord.job_posting_id
                    )
                  );
                  setTotalJobPostings((prev) => prev - 1);
                }
                break;
              case "DELETE":
                const oldId = oldRecord?.job_posting_id;
                if (oldId) {
                  const wasPresent = jobPostings.some(
                    (item) => item.job_posting_id === oldId
                  );
                  if (wasPresent) {
                    setJobPostings((prev) =>
                      prev.filter((item) => item.job_posting_id !== oldId)
                    );
                    setTotalJobPostings((prev) => prev - 1);
                  }
                }
                break;
              default:
                break;
            }
          }
        }
      )
      .subscribe((status, err) => {
        // Add error handling for subscription
        // Check for known error statuses or if the error object exists
        if (err || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          console.error("Realtime subscription error:", status, err); // Log status and error object
          // Use a generic error message or inspect 'err' for details
          const errorMessage = err?.message || `Subscription status: ${status}`;
          setErrorJobPostings(
            `Error subscribing to real-time updates: ${errorMessage}`
          );
        } else if (status === "SUBSCRIBED") {
          // console.log("Realtime subscription active for agency job postings.");
          setErrorJobPostings(null); // Clear previous errors on successful subscription
        }
      });

    return () => {
      // console.log("Removing agency job postings channel subscription.");
      supabase.removeChannel(channel);
    };
    // Ensure fetchFullJobPosting is now stable
  }, [agencyId, fetchFullJobPosting]);

  useEffect(() => {
    setLoadingJobPostings(true);
    fetchJobPostings();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
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
