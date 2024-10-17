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

    if (!alumniId) return;

    try {
      const response: PostgrestResponse<any> = await supabase
        .from("ViewGraduateTracerStudy")
        .select("*")
        .eq("alumni_id", alumniId);

      if (response.error) {
        throw response.error;
      }

      setGTS(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setErrorGTS(err.message || "Error fetching GTS");
      } else {
        setErrorGTS("An unknown error occurred");
      }
    } finally {
      setLoadingGTS(false);
    }
  }, [alumniId]);

  useEffect(() => {
    fetchGTS();
  }, [fetchGTS]);

  return { gts, loadingGTS, errorGTS };
};

export default useGTS;
