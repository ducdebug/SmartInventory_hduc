import axios, { AxiosError } from 'axios';
import authService from '../services/authService';

/**
 * Handles axios errors and returns a user-friendly error message
 * @param error Any error that occurred
 * @param defaultMessage A default message to show if the error cannot be identified
 * @returns A user-friendly error message
 */
export const handleAxiosError = (error: any, defaultMessage = 'An error occurred'): Error => {
  // Check if it's an Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Handle specific HTTP status codes
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400:
          return new Error(
            (axiosError.response.data as any)?.message || 
            'The request was invalid. Please check your input.'
          );
        case 401:
          // Handle expired token by logging out and redirecting
          console.log('Authentication token expired or invalid, logging out...');
          authService.logout();
          // Redirect to login page if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return new Error('Your session has expired. Please log in again.');
          
        case 403:
          return new Error('You do not have permission to perform this action.');
          
        case 404:
          return new Error('The requested resource was not found.');
          
        case 409:
          return new Error('This operation could not be completed due to a conflict.');
          
        case 422:
          return new Error('The request could not be processed. Please check your input.');
          
        case 500:
          return new Error('A server error occurred. Please try again later.');
          
        default:
          // Try to extract a message from the response if available
          const message = 
            typeof axiosError.response.data === 'string' 
              ? axiosError.response.data 
              : (axiosError.response.data as any)?.message || defaultMessage;
          return new Error(message);
      }
    } else if (axiosError.request) {
      // Network error - no response received
      return new Error('Network error. Please check your internet connection.');
    }
  }
  
  // If not an Axios error, check if it's an Error object
  if (error instanceof Error) {
    return error;
  }
  
  // For any other type of error, return the default message
  return new Error(defaultMessage);
};

/**
 * Checks if an error is an authentication error (401 or 403)
 * @param error Any error to check
 * @returns True if the error is an authentication error
 */
export const isAuthError = (error: any): boolean => {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.status === 401 || error.response.status === 403;
  }
  return false;
};
