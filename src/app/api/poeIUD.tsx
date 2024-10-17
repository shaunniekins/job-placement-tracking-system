import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "poe-files";

export const insertPOEFile = async (userId: string, fileData: any) => {
  try {
    let funcPublicUrl = "";

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${userId}`, fileData);

    if (data && !error) {
      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path).data;

      funcPublicUrl = publicUrl;
    }

    return funcPublicUrl;
  } catch (error: any) {
    console.error("Error inserting poe:", error);
    return null;
  }
};

export const deletePOEFile = async (userId: string) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`public/${userId}`]);

    if (error) {
      console.error("Error deleting image:", error.message);
      return;
    }

    return true;
  } catch (error: any) {
    console.error("Error deleting poe:", error);
    return null;
  }
};
