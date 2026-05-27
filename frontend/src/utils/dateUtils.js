/**
 * Formats a given month index based on a starting month string.
 * @param {string} startMonth - The start month in YYYY-MM format (e.g., "2026-06").
 * @param {number} monthIndex - The 1-based index of the month to calculate (e.g., 1 for the start month, 2 for the next).
 * @returns {string} - Formatted string like "June 2026". Returns generic fallback if startMonth is missing.
 */
export const formatMonth = (startMonth, monthIndex) => {
  if (!startMonth) {
    return `Month ${monthIndex}`;
  }

  try {
    const [year, month] = startMonth.split('-');
    // Month is 0-indexed in Date constructor
    const date = new Date(parseInt(year), parseInt(month) - 1 + (monthIndex - 1), 1);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting month:', error);
    return `Month ${monthIndex}`;
  }
};
