import { supabase } from "@/utils/supabase";

export const insertJobApplication = async (newJobApplication: any) => {
  try {
    const response = await supabase
      .from("JobApplications")
      .insert(newJobApplication)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting job application:", error);
    return null;
  }
};

export const updateJobApplication = async (
  jobApplicationId: number,
  updatedJobApplication: any
) => {
  try {
    const response = await supabase
      .from("JobApplications")
      .update(updatedJobApplication)
      .eq("job_application_id", jobApplicationId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating job application:", error);
    return null;
  }
};

export const deleteJobApplication = async (jobApplicationId: any) => {
  try {
    const response = await supabase
      .from("JobApplications")
      .delete()
      .eq("job_application_id", jobApplicationId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting job application:", error);
    return null;
  }
};
