import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

const useAlumni = (alumniId: string, userType: string) => {
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [isLoadingAlumni, setIsLoadingAlumni] = useState<boolean>(true);
  const [totalAlumniEntries, setTotalAlumniEntries] = useState<number>(0);

  const fetchAndSubscribeUsers = useCallback(async () => {
    if (!alumniId || !userType) return;

    try {
      let query = supabase.from("ViewUsers").select("*", { count: "exact" });

      if (userType === "alumni") {
        query = query.eq("meta_data->>user_type", "alumni");
      } else if (userType === "admin") {
        query = query.eq("meta_data->>user_type", "admin");
      } else if (userType === "agency") {
        query = query.eq("meta_data->>user_type", "agency");
      }

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
  }, [alumniId, userType]);

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
