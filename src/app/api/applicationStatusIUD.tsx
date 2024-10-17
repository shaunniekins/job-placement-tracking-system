import { supabase } from "@/utils/supabase";

export const insertApplicationStatus = async (newApplicationStatus: any) => {
  try {
    const response = await supabase
      .from("ApplicationStatus")
      .insert(newApplicationStatus)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting application status:", error);
    return null;
  }
};

export const updateApplicationStatus = async (
  applicationStatusId: number,
  updatedApplicationStatus: any
) => {
  try {
    const response = await supabase
      .from("ApplicationStatus")
      .update(updatedApplicationStatus)
      .eq("application_status_id", applicationStatusId);

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating application status:", error);
    return null;
  }
};
