import { supabase } from "@/utils/supabase";

export const insertOrgData = async (newOrgData: any) => {
  try {
    const response = await supabase
      .from("Organization")
      .insert(newOrgData)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting org data:", error);
    return null;
  }
};

export const updateOrgData = async (orgDataId: number, updatedOrgData: any) => {
  try {
    const response = await supabase
      .from("Organization")
      .update(updatedOrgData)
      .eq("id", orgDataId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating org data:", error);
    return null;
  }
};

export const deleteOrgData = async (orgDataId: number) => {
  try {
    const response = await supabase
      .from("Organization")
      .delete()
      .eq("id", orgDataId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting org data:", error);
    return null;
  }
};
