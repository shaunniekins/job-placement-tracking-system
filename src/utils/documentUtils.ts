import { supabase } from "@/utils/supabase";
import { formatDocumentKey } from "./compUtils";
import { getUserInfo } from "@/app/api/users";
import { documentExists } from "./compUtils";

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
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from("GraduateTracerStudy")
      .select("profile_of_employment")
      .eq("alumni_id", userId)
      .single();

    if (error) {
      // If no record found (code 'PGRST116'), it's not an error, just means no GTS data.
      if (error.code !== "PGRST116") {
        console.error(
          "Error fetching GTS data for self-employment check:",
          error
        );
      }
      return false;
    }

    return data?.profile_of_employment === "Self-employed";
  } catch (err) {
    console.error("Unexpected error during self-employment check:", err);
    return false;
  }
}

/**
 * Checks if a user has all the required documents specified in the job requirements.
 * @param userId The ID of the user.
 * @param requirements An array of strings representing the required documents.
 * @returns A promise that resolves to true if all documents exist, false otherwise.
 */
export const checkUserDocuments = async (
  userId: string,
  requirements: string[] | null | undefined
): Promise<boolean> => {
  if (
    !userId ||
    !requirements ||
    !Array.isArray(requirements) ||
    requirements.length === 0
  ) {
    // If no requirements are specified, assume the user meets them.
    return true;
  }

  try {
    const userData = await getUserInfo(userId);
    if (!userData || !userData.meta_data) {
      console.error("Could not fetch user data for document check.");
      return false; // Cannot verify documents if user data is unavailable
    }

    const userMetaData = userData.meta_data;

    // Check if the user is self-employed for COE requirement
    const isSelfEmployed = await isUserSelfEmployed(userId);

    for (const requirement of requirements) {
      // Skip COE check if the user is self-employed
      if (requirement === "Certificate of Employment" && isSelfEmployed) {
        continue;
      }

      if (!documentExists(userMetaData, requirement)) {
        console.log(`Missing required document: ${requirement}`);
        return false; // Found a missing document
      }
    }

    return true; // All required documents are present
  } catch (error) {
    console.error("Error checking user documents:", error);
    return false; // Return false in case of any error
  }
};
