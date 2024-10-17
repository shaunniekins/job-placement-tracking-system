import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useAlumni = (alumniId: string) => {
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState<boolean>(true);
  const [totalAlumniEntries, setTotalAlumniEntries] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    if (!alumniId) return;

    try {
      let query = supabase.from("ViewUsers").select("*", { count: "exact" });
      query.eq("meta_data->>user_type", "alumni");

      const response: PostgrestResponse<any> = await query;

      if (response.error) {
        throw response.error;
      }

      setAlumniData(response.data || []);
      setTotalAlumniEntries(response.count || 0);
      setIsLoadingAlumni(false);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching alumni:", err.message);
      } else {
        console.error("An unknown error occurred while fetching users");
      }
    } finally {
      setIsLoadingAlumni(false);
    }
  }, [alumniId]);

  useEffect(() => {
    fetchAndSubscribeUsers();
  }, [fetchAndSubscribeUsers]);

  return {
    alumniData,
    isLoadingAlumni,
    totalAlumniEntries,
    fetchAndSubscribeUsers,
  };
};

export default useAlumni;
