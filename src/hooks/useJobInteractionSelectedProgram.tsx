import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useJobInteractionSelectedProgram = (college: string, program: string) => {
  const [
    jobInteractionDataSelectedProgram,
    setJobInteractionDataSelectedProgram,
  ] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobApplications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("ViewJobApplicationsWithDetails")
        .select("*", { count: "exact" });

      if (college) {
        query = query.eq("applicant_college", college);
      }

      if (program) {
        query = query.eq("applicant_program", program);
      }

      const response: PostgrestResponse<any> = await query.order(
        "application_date"
      );

      if (response.error) {
        throw response.error;
      }

      setJobInteractionDataSelectedProgram(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching job postings");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [college, program]);

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
          fetchJobApplications(); // Refetch data on any change
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setError("Error subscribing to real-time updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobApplications]);

  useEffect(() => {
    fetchJobApplications(); // Fetch initial data

    const unsubscribe = subscribeToChanges(); // Set up real-time subscription

    return () => {
      if (unsubscribe) unsubscribe(); // Clean up on unmount
    };
  }, [fetchJobApplications, subscribeToChanges]);

  return {
    jobInteractionDataSelectedProgram,
    loading,
    error,
    fetchJobApplications,
  };
};

export default useJobInteractionSelectedProgram;
