import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

export type CollegeStats2 = {
  college: string;
  program: string;
  batch_year: number;
  total_applications: number;
  total_approved_applications: number;
};

const useCollegeStats2 = (
  batchYearFilter: string,
  collegeFilter?: string,
  programFilter?: string
) => {
  const [collegeStats, setCollegeStats] = useState<CollegeStats2[] | null>(
    null
  );
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const fetchCollegeStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);

    try {
      let query = supabase.from("ViewCollegeProgramStats2").select("*");

      if (batchYearFilter && batchYearFilter !== "all") {
        query = query.eq("batch_year", batchYearFilter);
      }

      if (collegeFilter && collegeFilter !== "all") {
        query = query.eq("college", collegeFilter);
      }

      if (programFilter && programFilter !== "all") {
        query = query.eq("program", programFilter);
      }

      const response: PostgrestResponse<CollegeStats2> = await query
        .order("college")
        .order("program");

      if (response.error) {
        throw response.error;
      }

      setCollegeStats(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setErrorStats(err.message || "Error fetching college stats");
      } else {
        setErrorStats("An unknown errorStats occurred");
      }
    } finally {
      setLoadingStats(false);
    }
  }, [batchYearFilter, collegeFilter, programFilter]);

  useEffect(() => {
    fetchCollegeStats();
  }, [fetchCollegeStats]);

  return { collegeStats, loadingStats, errorStats };
};

export default useCollegeStats2;
