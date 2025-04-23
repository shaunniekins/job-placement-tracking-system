import { supabase } from "@/utils/supabase";

const BUCKET_NAME = "orgchart-images";

export const uploadOrgChartImage = async (fileData: File) => {
  try {
    const fileName = `public/orgchart-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileData);

    if (error) {
      console.error("Error uploading organization chart image:", error);
      return null;
    }

    const { publicUrl } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path).data;

    // Update the URL in the database
    const { error: updateError } = await supabase
      .from("OrgChartImage")
      .upsert({ id: 1, image_url: publicUrl }, { onConflict: "id" });

    if (updateError) {
      console.error("Error updating image URL in database:", updateError);
      return null;
    }

    return publicUrl;
  } catch (error: any) {
    console.error("Error handling organization chart image:", error);
    return null;
  }
};

export const getOrgChartImage = async () => {
  try {
    const { data, error } = await supabase
      .from("OrgChartImage")
      .select("image_url")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Error fetching organization chart image:", error);
      return null;
    }

    return data?.image_url;
  } catch (error: any) {
    console.error("Error getting organization chart image:", error);
    return null;
  }
};

export const deleteOrgChartImage = async (imageUrl: string) => {
  try {
    // Extract path from URL
    const urlObj = new URL(imageUrl);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const filePath = `public/${fileName}`;

    // Delete the file from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      console.error("Error deleting organization chart image:", deleteError);
      return false;
    }

    // Update the URL in the database (set to null)
    const { error: updateError } = await supabase
      .from("OrgChartImage")
      .update({ image_url: null })
      .eq("id", 1);

    if (updateError) {
      console.error("Error updating image URL in database:", updateError);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error("Error handling organization chart image deletion:", error);
    return false;
  }
};
