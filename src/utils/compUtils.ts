import { format, formatDistanceToNow, parseISO } from "date-fns";

// Function to extract ID from pathname
export const getIdFromPathname = (pathname: string) => {
  const segments = pathname.split("/");
  return segments[segments.length - 1];
};

// Function to capitalize the first letter of a string
export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Function to format date
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "dd MMM yyyy");
};

export const formatDateSuffix = (timestamp: string) => {
  const date = parseISO(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / 6000;

  if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} minutes ago`;
  }

  return formatDistanceToNow(date, { addSuffix: true });
};

// send email notification function
export const sendEmailNotification = async (sendEmailData: any) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendEmailData),
    });
    const data = await response.json();
    if (response.ok) {
      console.log("Notification sent successfully!");
    } else {
      console.log(
        `Failed to send notification: ${data?.error || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

// send SMS notification function
export const sendSMSNotification = async (sendSMSData: any) => {
  try {
    const response = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendSMSData),
    });
    const data = await response.json();
    if (response.ok) {
      console.log("Notification sent successfully!");
    } else {
      console.log(
        `Failed to send notification: ${data?.error || "Unknown error"}`
      );
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export const formatActivityType = (text: string) => {
  return text.replace(/_/g, " ");
};
