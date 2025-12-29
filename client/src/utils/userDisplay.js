/**
 * User Display Name Utilities
 * Helper functions for displaying user information in a user-friendly way
 */

/**
 * Get display name for user (in priority order)
 * @param {Object} user - User object
 * @returns {string} Display name
 */
export const getDisplayName = (user) => {
  if (!user) return 'Account';
  
  // Priority order: fullName > businessName > email prefix > "Account"
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }
  
  if (user.businessName && user.businessName.trim()) {
    return user.businessName.trim();
  }
  
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix && emailPrefix.trim()) {
      return emailPrefix.trim();
    }
  }
  
  return 'Account';
};

/**
 * Get user initials for avatar fallback
 * @param {Object} user - User object
 * @returns {string} Initials (1-2 characters)
 */
export const getInitials = (user) => {
  if (!user) return 'A';
  
  // Try to get initials from fullName
  if (user.fullName && user.fullName.trim()) {
    const nameParts = user.fullName.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      // First letter of first name + first letter of last name
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      // Single name - use first letter
      return nameParts[0].charAt(0).toUpperCase();
    }
  }
  
  // Try to get initials from name (fallback)
  if (user.name && user.name.trim()) {
    const nameParts = user.name.trim().split(/\s+/);
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
  }
  
  // Fallback to email prefix (first 2 characters)
  if (user.email) {
    const emailPrefix = user.email.split('@')[0];
    if (emailPrefix && emailPrefix.length >= 2) {
      return emailPrefix.substring(0, 2).toUpperCase();
    } else if (emailPrefix && emailPrefix.length === 1) {
      return emailPrefix.toUpperCase();
    }
  }
  
  return 'A';
};

