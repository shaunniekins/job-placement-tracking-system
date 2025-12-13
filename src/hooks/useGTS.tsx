import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useGTS = (alumniId: string) => {
  const [gts, setGTS] = useState<any[]>([]);
  const [loadingGTS, setLoadingGTS] = useState(true);
  const [errorGTS, setErrorGTS] = useState<string | null>(null);

  const fetchGTS = useCallback(async () => {
    setLoadingGTS(true);
    setErrorGTS(null);

    if (!alumniId) {
      setLoadingGTS(false);
      return;
    }

    try {
      const response: PostgrestResponse<any> = await supabase
        .from("ViewGraduateTracerStudy")
        .select("*")
        .eq("alumni_id", alumniId);

      setGTS(response.data || []);
      if (response.error) {
        setErrorGTS(response.error.message);
      }
    } catch (error: any) {
      setErrorGTS(error.message);
    } finally {
      setLoadingGTS(false);
    }
  }, [alumniId]);

  useEffect(() => {
    fetchGTS();
  }, [fetchGTS]);

  return { gts, loadingGTS, errorGTS, refetchGTS: fetchGTS };
};

export default useGTS;
