import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

type BatchYear = {
  batch_year: number;
};

const useBatchYears = () => {
  const [batchYears, setBatchYears] = useState<BatchYear[]>([]);
  const [isBatchYearsLoading, setIsBatchYearsLoading] = useState<boolean>(true);
  const [batchYearsError, setBatchYearsError] = useState<string | null>(null);

  const fetchBatchYears = useCallback(async () => {
    setIsBatchYearsLoading(true);
    setBatchYearsError(null);

    try {
      const response: PostgrestResponse<BatchYear> = await supabase
        .from("ViewAvailableBatchYear")
        .select("*");

      if (response.error) {
        throw response.error;
      }

      setBatchYears(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setBatchYearsError(err.message || "Error fetching batch years");
      } else {
        setBatchYearsError("An unknown batchYearsError occurred");
      }
    } finally {
      setIsBatchYearsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatchYears();
  }, [fetchBatchYears]);

  return {
    batchYears,
    isBatchYearsLoading,
    batchYearsError,
  };
};

export default useBatchYears;
