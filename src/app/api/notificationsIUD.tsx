import { supabase } from "@/utils/supabase";

export const notificationCheckerToSendForSMS = async (userId: string) => {
  const { data, error } = await supabase
    .from("Notifications")
    .select("*")
    .eq("receiver_id", userId)
    .eq("message", "Your MOA has been expired!")
    .order("created_at", { ascending: false }) // Assumes you have a created_at column
    .limit(1);

  if (error) {
    console.error("Error checking notification:", error);
    return null;
  }

  return data?.[0] || null; // Return the first (latest) item or null if none found
};

export const insertNotification = async (newNotification: any) => {
  try {
    const response = await supabase
      .from("Notifications")
      .insert(newNotification)
      .select();

    if (response.error) {
      throw response.error;
    }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting notification:", error);
    return null;
  }
};

export const updateNotification = async (
  notificationId: number,
  updates: any
) => {
  try {
    const { error } = await supabase
      .from("Notifications")
      .update(updates)
      .eq("notification_id", notificationId);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Error updating notification:", err);
  }
};

export const deleteNotification = async (notificationId: number) => {
  try {
    const { error } = await supabase
      .from("Notifications")
      .delete()
      .eq("notification_id", notificationId);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Error deleting notification:", err);
  }
};

export const markNotificationAsSeen = async (
  notificationId: number,
  currentStatus: string
) => {
  try {
    if (!notificationId) return;

    const { error } = await supabase
      .from("Notifications")
      .update({ seen: !currentStatus })
      .eq("notification_id", notificationId);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Error marking notifications as seen:", err);
  }
};

export const markAllNotificationsAsSeen = async (receiver_id: string) => {
  try {
    const { error } = await supabase
      .from("Notifications")
      .update({ seen: true })
      .eq("seen", false)
      .eq("receiver_id", receiver_id);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Error marking all notifications as seen:", err);
  }
};

// export const markNotificationsAsSeen = async (userId: string) => {
//   try {
//     if (!userId) return;

//     const { error } = await supabase
//       .from("Notifications")
//       .update({ seen: true })
//       .eq("receiver_id", userId)
//       .eq("seen", false); // Only update unseen notifications

//     if (error) {
//       throw error;
//     }
//   } catch (err) {
//     console.error("Error marking notifications as seen:", err);
//   }
// };
