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
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "dd MMM yyyy");
  } catch (error) {
    return "Invalid Date";
  }
};

export const formatDateYearFirst = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "yyyy MMM dd");
  } catch (error) {
    return "Invalid Date";
  }
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

export const validatePhoneNumber = (number: string) => {
  const phoneRegex = /^\+639\d{9}$/;
  return phoneRegex.test(number);
};

export const formatDocumentKey = (documentType: string): string => {
  // Special case for training certificates - use a different key format
  if (documentType === "Certificate of Trainings and Seminars") {
    return "training-certificates";
  }
  return documentType.toLowerCase().replace(/\s+/g, "-");
};

// Add new functions for handling multiple documents
export const isMultipleDocumentType = (documentType: string): boolean => {
  return documentType === "Certificate of Trainings and Seminars";
};

// Function to check if a document exists in user metadata
export const documentExists = (
  userData: any,
  documentType: string
): boolean => {
  if (!userData) return false;

  const docKey = formatDocumentKey(documentType);

  if (isMultipleDocumentType(documentType)) {
    return (
      userData[docKey] &&
      Array.isArray(userData[docKey]) &&
      userData[docKey].length > 0
    );
  } else {
    return (
      userData[docKey] &&
      typeof userData[docKey] === "string" &&
      userData[docKey].trim() !== ""
    );
  }
};
