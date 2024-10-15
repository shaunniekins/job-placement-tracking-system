import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

type CollegeStats = {
  college: string;
  program: string;
  batch_year: number;
  total_population: number;
  employed_count: number;
  course_aligned_count: number;
  scholarship_count: number;
};

const useCollegeStats = (
  batchYearFilter: string,
  collegeFilter?: string,
  programFilter?: string
) => {
  const [collegeStats, setCollegeStats] = useState<CollegeStats[] | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  const fetchCollegeStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorStats(null);

    try {
      let query = supabase.from("ViewCollegeProgramStats").select("*");

      if (batchYearFilter && batchYearFilter !== "all") {
        query = query.eq("batch_year", batchYearFilter);
      }

      if (collegeFilter && collegeFilter !== "all") {
        query = query.eq("college", collegeFilter);
      }

      if (programFilter && programFilter !== "all") {
        query = query.eq("program", programFilter);
      }

      const response: PostgrestResponse<CollegeStats> = await query;

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

export default useCollegeStats;
