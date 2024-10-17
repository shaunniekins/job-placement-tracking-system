import { supabase } from "@/utils/supabase";

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
    const response = await supabase
      .from("GraduateTracerStudy")
      .insert(newGTS)
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
    const response = await supabase
      .from("GraduateTracerStudy")
      .update(updatedGTS)
      .eq("alumni_id", userId)
      .select();

    if (response.error) {
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
