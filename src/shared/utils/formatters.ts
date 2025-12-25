/**
 * Utility functions for formatting values in the application
 */

/**
 * Format a date string to localized format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Use Intl.DateTimeFormat for localized date formatting
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format a number as currency
 * @param amount Number amount
 * @param currency Currency code (default: SAR for Saudi Riyal)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  if (amount === undefined || amount === null) return '';
  
  try {
    // Use Intl.NumberFormat for localized currency formatting
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ${currency}`;
  }
};

/**
 * Format a phone number for display
 * @param phoneNumber Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Basic formatting for Saudi phone numbers
  // Adjust the format according to your specific requirements
  try {
    // Format as: +966 XX XXX XXXX
    if (phoneNumber.startsWith('+')) {
      const cleaned = phoneNumber.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{3})(\d{2})(\d{3})(\d{4})$/);
      
      if (match) {
        return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    }
    
    return phoneNumber;
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return phoneNumber;
  }
};

/**
 * Format a number with thousand separators
 * @param num Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '';
  
  try {
    return new Intl.NumberFormat('ar-SA').format(num);
  } catch (error) {
    console.error('Error formatting number:', error);
    return num.toString();
  }
}; 