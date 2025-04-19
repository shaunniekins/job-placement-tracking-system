import { supabase } from "@/utils/supabase";

export const insertJobPosting = async (newJobPosting: any) => {
  try {
    const response = await supabase
      .from("JobPostings")
      .insert(newJobPosting)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting job posting:", error);
    return null;
  }
};

export const updateJobPosting = async (
  jobPostingId: number,
  updatedJobPosting: any
) => {
  try {
    const response = await supabase
      .from("JobPostings")
      .update(updatedJobPosting)
      .eq("job_posting_id", jobPostingId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating job posting:", error);
    return null;
  }
};

export const deleteJobPosting = async (jobPostingId: any) => {
  try {
    const response = await supabase
      .from("JobPostings")
      .delete()
      .eq("job_posting_id", jobPostingId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting job posting:", error);
    return null;
  }
};

/**
 * Increments the accepted_applicants count for a specific job posting.
 * @param jobPostingId The ID of the job posting to update.
 */
export const incrementAcceptedApplicants = async (jobPostingId: number) => {
  try {
    const { error } = await supabase.rpc("increment_accepted_applicants", {
      p_job_posting_id: jobPostingId,
    });

    if (error) {
      throw error;
    }
    console.log(
      `Incremented accepted_applicants for job_posting_id: ${jobPostingId}`
    );
    return true;
  } catch (error: any) {
    console.error("Error incrementing accepted applicants:", error);
    return false;
  }
};
