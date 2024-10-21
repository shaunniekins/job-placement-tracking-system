import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";

interface AgencyStats {
  agency_id: string;
  total_job_postings: number;
  total_job_applications: number;
  total_accepted_applications: number;
}

const useAgencyStats = (agency_id: string) => {
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgencyStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!agency_id) return;

    try {
      const response: any = await supabase
        .from("AgencyStatistics")
        .select("*")
        .eq("agency_id", agency_id)
        .single(); // Ensure we get a single object

      if (response.error) {
        throw response.error;
      }

      setStats(response.data || null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching agency statistics");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [agency_id]);

  useEffect(() => {
    fetchAgencyStats();
  }, [fetchAgencyStats]);

  return { stats, loading, error };
};

export default useAgencyStats;
