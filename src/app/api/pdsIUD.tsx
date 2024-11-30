import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "pds-files";

export const insertPDSFiles = async (userId: string, fileData: any) => {
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
    console.error("Error inserting pds:", error);
    return null;
  }
};

export const deletePDSFile = async (userId: string) => {
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
    console.error("Error deleting pds:", error);
    return null;
  }
};
