import { supabase } from "@/utils/supabase";

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
