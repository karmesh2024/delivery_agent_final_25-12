/**
 * Formats a number as a currency string (e.g., EGP).
 * TODO: Enhance with locale and currency symbol options if needed.
 * @param amount The number to format.
 * @param currencyCode The currency code (e.g., 'EGP'). Defaults to 'EGP'.
 * @returns A string representing the formatted currency.
 */
export const formatCurrency = (amount: number, currencyCode: string = 'EGP'): string => {
  if (isNaN(amount)) {
    return '-'; // Or handle as an error, or return '0.00 EGP' etc.
  }
  // Basic formatting, can be expanded with Intl.NumberFormat for more robust localization
  const formattedAmount = amount.toFixed(2); 
  return `${formattedAmount} ${currencyCode}`;
};

/**
 * Formats a date string or Date object into a more readable format.
 * TODO: Implement actual date formatting, perhaps using date-fns or Intl.DateTimeFormat.
 * @param date The date to format.
 * @returns A string representing the formatted date.
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('ar-EG', { // Example: Arabic, Egypt
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date); // Fallback to original string if formatting fails
  }
}; 