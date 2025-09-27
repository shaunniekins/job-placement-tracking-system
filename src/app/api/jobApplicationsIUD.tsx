import { supabase } from "@/utils/supabase";

export const checkIfApplied = async (userId: string, jobPostingId: number) => {
  const { data, error } = await supabase
    .from("ViewJobApplicationsWithDetails")
    .select("*")
    .eq("applicant_id", userId)
    .eq("job_posting_id", jobPostingId);

  if (error) {
    console.error("Error checking application status:", error);
    return false;
  }

  return data.length > 0;
};

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
      .update(updatedJobApplication) // Make sure this object has 'application_status' key
      .eq("job_application_id", jobApplicationId)
      .select();

    if (response.error) {
      console.error(
        `Supabase error updating JobApplication ID ${jobApplicationId}:`,
        response.error
      );
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error(
      `Caught error updating JobApplication ID ${jobApplicationId}:`,
      error
    );
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
