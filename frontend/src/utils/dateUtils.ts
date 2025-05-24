/**
 * Formats a date string in a user-friendly way based on how recent it is
 * @param dateStr ISO date string
 * @returns Formatted date string
 */
export const formatDateString = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(date, today)) {
    return 'Today';
  } else if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  } else {
    return formatFullDate(date);
  }
};

/**
 * Formats a timestamp in a relative way (e.g., "Today at 2:30 PM", "Yesterday at 5:15 PM", etc.)
 * @param timestamp ISO date string
 * @returns Formatted time string
 */
export const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isSameDay(date, now)) {
    return `Today at ${formatTime(date)}`;
  } else if (isSameDay(date, yesterday)) {
    return `Yesterday at ${formatTime(date)}`;
  } else if (isSameYear(date, now)) {
    // Same year, show month and day
    return `${formatMonthDay(date)} at ${formatTime(date)}`;
  } else {
    // Different year, show full date
    return formatFullDate(date);
  }
};

// Helper functions
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isSameYear = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear();
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const formatMonthDay = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = shortMonths[date.getMonth()];
  const day = date.getDate();
  
  return `${month} ${day}`;
};

const formatFullDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = shortMonths[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
};
