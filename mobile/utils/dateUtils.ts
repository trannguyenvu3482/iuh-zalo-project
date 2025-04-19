/**
 * Formats a date to a readable "time ago" format in Vietnamese
 * Example: "15 phút trước", "1 giờ trước", "Hôm qua", etc.
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "Vừa xong";
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Hôm qua";
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }

  // Format as date
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // If same year, only show day and month
  if (year === now.getFullYear()) {
    return `${day}/${month}`;
  }

  // Otherwise show full date
  return `${day}/${month}/${year}`;
}
