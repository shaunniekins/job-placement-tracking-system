import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import { getOrgChartImage } from "@/app/api/orgChartImageIUD";

interface Node {
  id: string;
  label: string;
  name?: string;
  parent_id?: string;
  children?: Node[];
}

const useOrganization = () => {
  const [orgData, setOrgData] = useState<Node[]>([]);
  const [orgChartImageUrl, setOrgChartImageUrl] = useState<string | null>(null);
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

  const fetchOrgChartImage = useCallback(async () => {
    try {
      const imageUrl = await getOrgChartImage();
      setOrgChartImageUrl(imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error fetching organization chart image:", err.message);
      } else {
        console.error("An unknown error occurred");
      }
    } finally {
      setLoadingOrgData(false);
    }
  }, []);

  const subscribeToChanges = useCallback(() => {
    const orgChannel = supabase
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

    const chartChannel = supabase
      .channel("orgchart_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "OrgChartImage",
        },
        (payload) => {
          fetchOrgChartImage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orgChannel);
      supabase.removeChannel(chartChannel);
    };
  }, [fetchOrganization, fetchOrgChartImage]);

  useEffect(() => {
    fetchOrganization();
    fetchOrgChartImage();

    const unsubscribe = subscribeToChanges();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchOrganization, fetchOrgChartImage, subscribeToChanges]);

  return { orgData, orgChartImageUrl, loadingOrgData };
};

export default useOrganization;
