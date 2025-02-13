import { supabase } from "@/utils/supabase";

interface UserMoaData {
  id: string;
  moa_year_end: string;
}

export const moaExpirationChecker = async (userId: string) => {
  const { data, error } = await supabase
    .from("ViewUsers")
    .select("id, meta_data->>moa_year_end")
    .eq("id", userId)
    .single<UserMoaData>();

  if (error) {
    console.error("Error checking MOA expiration:", error);
    return false;
  }

  if (!data || !data.moa_year_end) {
    return false;
  }

  const moaEndDate = new Date(data.moa_year_end);

  // Add 2 months to current date for warning period
  const warningDate = new Date();
  warningDate.setMonth(warningDate.getMonth() + 2);

  // Return true if current date is within 2 months of expiration or after expiration
  return moaEndDate <= warningDate;
};
