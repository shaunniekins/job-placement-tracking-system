import { supabase } from "@/utils/supabase";

export const insertNotification = async (
  newNotification: any,
  receiverEmail: string
) => {
  try {
    const response = await supabase
      .from("Notifications")
      .insert(newNotification)
      .select();

    if (response.error) {
      throw response.error;
    }

    // Extract the message from the response data
    const notificationMessage = response.data[0]?.message;

    // Add email notification here
    // console.log("receiverEmail", receiverEmail);
    // console.log("response.data", response.data);

    // try {
    //   const emailResponse = await fetch("/api/send-email", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       to: receiverEmail,
    //       subject: "JPTS Notification",
    //       body: notificationMessage,
    //     }),
    //   });

    //   let emailData;
    //   try {
    //     emailData = await emailResponse.json();
    //   } catch (error) {
    //     emailData = null;
    //   }

    //   // console.log("Email sent:", emailData);
    // } catch (emailError) {
    //   console.error("Error sending email:", emailError);
    // }

    return response.data;
  } catch (error: any) {
    console.error("Error inserting notification:", error);
    return null;
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
