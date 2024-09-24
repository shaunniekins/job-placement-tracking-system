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