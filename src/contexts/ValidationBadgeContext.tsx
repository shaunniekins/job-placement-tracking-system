"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { supabase } from "@/utils/supabase"; // Use the client supabase instance

interface ValidationBadgeContextType {
  agencyCount: number;
  alumniCount: number;
  jpCount: number;
  refetchCounts: () => void;
  isLoadingCounts: boolean;
}

const ValidationBadgeContext = createContext<
  ValidationBadgeContextType | undefined
>(undefined);

export const ValidationBadgeProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [agencyCount, setAgencyCount] = useState(0);
  const [alumniCount, setAlumniCount] = useState(0);
  const [jpCount, setJpCount] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const fetchCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      // Fetch pending agency users
      const { count: agencyDataCount, error: agencyError } = await supabase
        .from("ViewUsers")
        .select("*", { count: "exact", head: true })
        .eq("meta_data->>user_type", "agency")
        .eq("meta_data->>account_status", "pending");

      // Fetch pending alumni users
      const { count: alumniDataCount, error: alumniError } = await supabase
        .from("ViewUsers")
        .select("*", { count: "exact", head: true })
        .eq("meta_data->>user_type", "alumni")
        .eq("meta_data->>account_status", "pending");

      // Fetch pending job postings
      const { count: jpDataCount, error: jpError } = await supabase
        .from("JobPostings")
        .select("*", { count: "exact", head: true })
        .eq("job_status", "pending");

      if (agencyError)
        console.error("Error fetching agency count:", agencyError);
      if (alumniError)
        console.error("Error fetching alumni count:", alumniError);
      if (jpError) console.error("Error fetching job posting count:", jpError);

      setAgencyCount(agencyDataCount ?? 0);
      setAlumniCount(alumniDataCount ?? 0);
      setJpCount(jpDataCount ?? 0);
    } catch (error) {
      console.error("Error fetching validation counts:", error);
      setAgencyCount(0);
      setAlumniCount(0);
      setJpCount(0);
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // Optional: Set up real-time subscriptions if needed, though manual refetch might be sufficient here.
    // Remember to clean up subscriptions on unmount.
  }, [fetchCounts]);

  const value = {
    agencyCount,
    alumniCount,
    jpCount,
    refetchCounts: fetchCounts, // Expose the fetch function as refetchCounts
    isLoadingCounts,
  };

  return (
    <ValidationBadgeContext.Provider value={value}>
      {children}
    </ValidationBadgeContext.Provider>
  );
};

export const useValidationBadge = () => {
  const context = useContext(ValidationBadgeContext);
  if (context === undefined) {
    throw new Error(
      "useValidationBadge must be used within a ValidationBadgeProvider"
    );
  }
  return context;
};
