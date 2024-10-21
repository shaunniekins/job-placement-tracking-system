import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { PostgrestResponse } from "@supabase/supabase-js";

type Activity = {
  activity_id: string;
  activity_title: string;
  activity_type: string;
  activity_description: string;
  activity_location: string;
  activity_date: string;
  created_at: string;
};

const useActivities = (rowsPerPage: number, currentPage: number) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [errorActivities, setErrorActivities] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    const offset = (currentPage - 1) * rowsPerPage;
    setLoadingActivities(true);
    setErrorActivities(null);

    const currentDate = new Date().toISOString();

    try {
      let query = supabase
        .from("Activities")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .gt("activity_date", currentDate) // Only fetch future activities
        .range(offset, offset + rowsPerPage - 1);

      const response: PostgrestResponse<Activity> = await query;

      if (response.error) {
        throw response.error;
      }

      setActivities(response.data || []);
      setTotalActivities(response.count || 0);
    } catch (err) {
      if (err instanceof Error) {
        setErrorActivities(err.message || "Error fetching activities");
      } else {
        setErrorActivities("An unknown error occurred");
      }
    } finally {
      setLoadingActivities(false);
    }
  }, [rowsPerPage, currentPage]);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("activities_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Activities",
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          setActivities((prevState) => {
            switch (eventType) {
              case "INSERT":
                if (prevState.length < rowsPerPage) {
                  return [newRecord as Activity, ...prevState];
                }
                return prevState;
              case "UPDATE":
                return prevState.map((activity) =>
                  activity.activity_id === (newRecord as Activity).activity_id
                    ? (newRecord as Activity)
                    : activity
                );
              case "DELETE":
                return prevState.filter(
                  (activity) =>
                    activity.activity_id !== (oldRecord as Activity).activity_id
                );
              default:
                return prevState;
            }
          });
        }
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          setErrorActivities("Error subscribing to real-time updates");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    fetchActivities();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchActivities, subscribeToChanges]);

  return {
    activities,
    totalActivities,
    loadingActivities,
    errorActivities,
  };
};

export default useActivities;
