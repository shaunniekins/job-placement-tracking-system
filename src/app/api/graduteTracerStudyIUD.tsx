import { supabase } from "@/utils/supabase";

// Define the actual columns of the GraduateTracerStudy table
// Ensure this list is accurate and complete based on your table schema
const VALID_GTS_COLUMNS = [
  "id", // Usually auto-generated, but good to list if needed elsewhere
  "alumni_id",
  "contact_numbers",
  "civil_status",
  "sex",
  "region",
  "province",
  "location_of_residence",
  "educational_background", // Assuming JSON/JSONB
  "professional_examination", // Assuming JSON/JSONB
  "course_reasons", // Assuming JSON/JSONB
  "training_after_college", // Assuming JSON/JSONB
  "advance_studies_reason",
  "other_advance_studies_reason",
  "employment_status",
  "unemployment_reasons", // Assuming JSON/JSONB or array
  "other_unemployment_reason",
  "present_employment_status",
  "present_occupation",
  "major_line_of_business",
  "place_of_work",
  "agency", // Added agency column
  "is_first_time_job_after_college",
  "staying_on_job_reasons", // Assuming JSON/JSONB or array
  "other_staying_on_job_reason",
  "is_first_job_related_to_course",
  "first_job_related_to_course_reasons", // Assuming JSON/JSONB or array
  "other_first_job_related_to_course_reason",
  "leaving_job_reasons", // Assuming JSON/JSONB or array
  "other_leaving_job_reason",
  "staying_duration_in_first_job", // Assuming JSON/JSONB or array
  "other_staying_duration_in_first_job",
  "first_job_found_through", // Assuming JSON/JSONB or array
  "other_first_job_found_through",
  "duration_before_first_job", // Assuming JSON/JSONB or array
  "other_duration_before_first_job",
  "job_levels", // Assuming JSON/JSONB
  "initial_gross_first_job",
  "is_curriculum_relevant_in_first_job",
  "learned_competencies", // Assuming JSON/JSONB or array
  "other_learned_competencies",
  "suggestions",
  "created_at", // Usually auto-managed
  // Add any other actual columns from your GraduateTracerStudy table
];

// Helper function to filter data object to include only valid columns
const filterValidGTSData = (data: any): Partial<any> => {
  const filteredData: Partial<any> = {};
  for (const key in data) {
    if (VALID_GTS_COLUMNS.includes(key)) {
      filteredData[key] = data[key];
    }
  }
  // Ensure alumni_id is always present for updates/inserts if it's part of the input data
  if (data.alumni_id && !filteredData.alumni_id) {
    filteredData.alumni_id = data.alumni_id;
  }
  // Remove 'created_at' as it's typically auto-managed
  delete filteredData.created_at;

  return filteredData;
};

export const checkIfExistingGTS = async (userId: string) => {
  const { data, error } = await supabase
    .from("GraduateTracerStudy")
    .select("*")
    .eq("alumni_id", userId);

  if (error) {
    console.error("Error checking existing GTS:", error);
    return false;
  }

  return data.length > 0;
};

export const insertGraduateTracerStudy = async (newGTS: any) => {
  try {
    // Filter the input data to include only valid columns
    const dataToInsert = filterValidGTSData(newGTS);

    // Ensure alumni_id is present
    if (!dataToInsert.alumni_id) {
      throw new Error("alumni_id is required for inserting GTS data.");
    }

    const response = await supabase
      .from("GraduateTracerStudy")
      .insert(dataToInsert)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting graduate tracer study:", error);
    return null;
  }
};

export const updateGraduateTracerStudy = async (
  userId: string,
  updatedGTS: any
) => {
  try {
    // Filter the input data to include only valid columns
    const dataToUpdate = filterValidGTSData(updatedGTS);

    // Remove alumni_id from the update payload itself, as it's used in the .eq() filter
    delete dataToUpdate.alumni_id;

    // Check if there's anything left to update
    if (Object.keys(dataToUpdate).length === 0) {
      console.warn("No valid fields to update for GTS.");
      // Optionally return the existing data or an empty array/null
      const { data: existingData, error: fetchError } = await supabase
        .from("GraduateTracerStudy")
        .select()
        .eq("alumni_id", userId);
      return existingData;
    }

    const response = await supabase
      .from("GraduateTracerStudy")
      .update(dataToUpdate)
      .eq("alumni_id", userId)
      .select();

    if (response.error) {
      // Log the data being sent if there's an error
      console.error("Data attempted to update:", dataToUpdate);
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating graduate tracer study:", error);
    return null;
  }
};

export const deleteGraduateTracerStudy = async (gtsId: any) => {
  try {
    const response = await supabase
      .from("GraduateTracerStudy")
      .delete()
      .eq("id", gtsId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting graduate tracer study:", error);
    return null;
  }
};

// Optional: Function to specifically update agency, e.g., upon job acceptance
export const updateGTSAgency = async (userId: string, agencyName: string) => {
  try {
    const { data, error } = await supabase
      .from("GraduateTracerStudy")
      .update({ agency: agencyName })
      .eq("alumni_id", userId)
      .select();

    if (error) {
      throw error;
    }
    return data;
  } catch (error: any) {
    console.error("Error updating GTS agency:", error);
    return null;
  }
};
