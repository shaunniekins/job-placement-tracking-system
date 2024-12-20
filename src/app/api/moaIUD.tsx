import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "moa-files";

export const insertMOAFiles = async (userId: string, fileData: any) => {
  try {
    let funcPublicUrl = "";

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`public/${userId}`, fileData);

    if (error) console.error("Error inserting moa:", error);

    if (data && !error) {
      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path).data;

      funcPublicUrl = publicUrl;
    }

    return funcPublicUrl;
  } catch (error: any) {
    console.error("Error inserting moa:", error);
    return null;
  }
};
