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
