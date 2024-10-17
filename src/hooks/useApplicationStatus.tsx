import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useApplicationStatus = (jobApplicationId: string) => {
  const [applicationStatus, setApplicationStatus] = useState<any | null>(null);
  const [loadingApplicationStatus, setLoadingApplicationStatus] =
    useState(true);
  const [errorApplicationStatus, setErrorApplicationStatus] = useState<
    string | null
  >(null);

  const fetchApplicationStatus = useCallback(async () => {
    setLoadingApplicationStatus(true);
    setErrorApplicationStatus(null);

    if (!jobApplicationId) return;

    try {
      let query = supabase
        .from("ApplicationStatus")
        .select("*")
        .eq("job_application_id", jobApplicationId);

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setApplicationStatus(response.data ? response.data[0] : null);
    } catch (err) {
      if (err instanceof Error) {
        setErrorApplicationStatus(
          err.message || "Error fetching application status"
        );
      } else {
        setErrorApplicationStatus("An unknown error occurred");
      }
    } finally {
      setLoadingApplicationStatus(false);
    }
  }, [jobApplicationId]);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("application_status_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ApplicationStatus",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setApplicationStatus((prevState: any) => {
            switch (eventType) {
              case "INSERT":
                if (newRecord.job_application_id === jobApplicationId) {
                  return newRecord;
                }
                break;
              case "UPDATE":
                if (newRecord.job_application_id === jobApplicationId) {
                  return newRecord;
                }
                break;
              case "DELETE":
                if (oldRecord.job_application_id === jobApplicationId) {
                  return null;
                }
                break;
              default:
                return prevState;
            }
            return prevState;
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          //   console.error("Error subscribing to real-time updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobApplicationId]);

  useEffect(() => {
    fetchApplicationStatus();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchApplicationStatus, subscribeToChanges]);

  return {
    applicationStatus,
    loadingApplicationStatus,
    errorApplicationStatus,
    fetchApplicationStatus,
  };
};

export default useApplicationStatus;
