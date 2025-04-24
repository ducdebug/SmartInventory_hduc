/**
 * Utility functions for handling API errors
 */

/**
 * Handles and transforms axios errors into a standardized format
 * @param error The error caught from axios request
 * @param defaultMessage Default message to use if error doesn't have a clear message
 * @returns A standardized error object with message property
 */
export const handleAxiosError = (error: any, defaultMessage: string = 'An error occurred'): Error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const message = error.response.data?.message || 
                    error.response.data?.error || 
                    `Error ${error.response.status}: ${error.response.statusText}`;
    return new Error(message);
  } else if (error.request) {
    // The request was made but no response was received
    return new Error('No response received from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    return new Error(error.message || defaultMessage);
  }
};

/**
 * Parses an error object to extract a user-friendly message
 * @param error Any caught error
 * @returns A user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
