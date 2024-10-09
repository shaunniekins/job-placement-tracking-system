import { supabase } from "@/utils/supabase";

export const insertActivity = async (newActivity: any) => {
  try {
    const response = await supabase
      .from("Activities")
      .insert(newActivity)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting activity:", error);
    return null;
  }
};

export const updateActivity = async (
  activityId: number,
  updatedActivity: any
) => {
  try {
    const response = await supabase
      .from("Activities")
      .update(updatedActivity)
      .eq("activity_id", activityId)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error updating activity:", error);
    return null;
  }
};

export const deleteActivity = async (activityId: any) => {
  try {
    const response = await supabase
      .from("Activities")
      .delete()
      .eq("activity_id", activityId);

    if (response.error) {
      throw response.error;
    }
    return response.data;
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    return null;
  }
};
