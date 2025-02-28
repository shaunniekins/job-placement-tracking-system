import { supabase } from "@/utils/supabase";
import { formatDocumentKey } from "./compUtils";

/**
 * Deletes Certificate of Employment if a user is self-employed
 */
export async function deleteCOEIfSelfEmployed(userId: string): Promise<void> {
  try {
    // Get the user data to check if COE exists
    const { data: user } = await supabase.auth.getUser();

    if (!user) return;

    const docKey = formatDocumentKey("Certificate of Employment");

    // Check if there's a COE to delete
    if (user.user?.user_metadata[docKey]) {
      // Get the file path from the URL
      const fileUrl = user.user?.user_metadata[docKey];
      const urlParts = fileUrl.split("/public/documents/");

      if (urlParts.length === 2) {
        const filePath = urlParts[1];

        // Delete the file from storage
        await fetch("/api/buckets/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filePath }),
        });
      }

      // Update user metadata to remove the COE reference
      await supabase.auth.updateUser({
        data: {
          [docKey]: "",
        },
      });

      console.log(
        "Certificate of Employment deleted due to self-employment status"
      );
    }
  } catch (error) {
    console.error("Error deleting COE:", error);
  }
}

/**
 * Checks if a user is self-employed based on GTS data
 */
export async function isUserSelfEmployed(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("graduate_tracer_study")
      .select("present_employment_status")
      .eq("alumni_id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.present_employment_status === "Self-employed";
  } catch (error) {
    console.error("Error checking self-employment status:", error);
    return false;
  }
}
