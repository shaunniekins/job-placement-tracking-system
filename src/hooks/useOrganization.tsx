import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";

interface Node {
  id: string;
  label: string;
  name?: string;
  parent_id?: string;
  children?: Node[];
}

const useOrganization = () => {
  const [orgData, setOrgData] = useState<Node[]>([]);
  const [loadingOrgData, setLoadingOrgData] = useState(true);

  const fetchOrganization = useCallback(async () => {
    try {
      const { data: organization, error } = await supabase
        .from("ViewOrgHierarchy")
        .select("*");

      if (error) {
        throw error;
      }

      setOrgData(organization || []);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching organization:", err.message);
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setLoadingOrgData(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const channel = supabase
      .channel("organization_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Organization",
        },
        (payload) => {
          fetchOrganization();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrganization]);

  useEffect(() => {
    fetchOrganization();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchOrganization, subscribeToChanges]);

  return { orgData, loadingOrgData };
};

export default useOrganization;
