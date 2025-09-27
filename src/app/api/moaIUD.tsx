import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "moa-files";

export const insertMOAFiles = async (userId: string, fileData: any) => {
  try {
    // Generate a unique filename with timestamp to avoid conflicts
    const timestamp = new Date().getTime();
    const fileExt = fileData.name.split(".").pop();
    const uniqueFilename = `${userId}_${timestamp}.${fileExt}`;
    const filePath = `public/${uniqueFilename}`;

    // First try to find and delete any existing files for this user1
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list("public", {
        search: userId,
      });

    // Delete existing files if any are found
    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((file) => `public/${file.name}`);

      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToRemove);

      if (removeError) {
        console.error("Error removing existing MOA files:", removeError);
        // Continue with upload anyway
      }
    }

    // Upload new file without requiring upsert
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileData, {
        cacheControl: "3600",
      });

    if (error) {
      console.error("Error uploading MOA file:", error);
      return null;
    }

    if (data) {
      const { publicUrl } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path).data;

      return publicUrl;
    }

    return null;
  } catch (error: any) {
    console.error("Exception in insertMOAFiles:", error);
    return null;
  }
};
