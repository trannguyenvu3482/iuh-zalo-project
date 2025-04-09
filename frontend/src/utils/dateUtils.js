import { format } from 'date-fns'

/**
 * Formats a timestamp into a human-readable string in Vietnamese
 * @param {string} timestamp - The timestamp to format
 * @returns {string} Formatted date string in Vietnamese
 */
export const formatLastActivity = (timestamp) => {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const now = new Date()

  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    return format(date, 'HH:mm')
  }

  // Get the time difference in various units
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  // Format based on time difference
  if (diffInMinutes < 1) {
    return '1 phút'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút`
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ`
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày`
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần`
  } else if (diffInMonths < 12) {
    return `${diffInMonths} tháng`
  } else {
    return `${diffInYears} năm`
  }
} 