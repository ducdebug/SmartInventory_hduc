export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getUserId = (): string | null => {
  return localStorage.getItem('userId');
};

export const getUserRole = (): string | null => {
  return localStorage.getItem('userRole');
};

export const isAdmin = (): boolean => {
  return getUserRole() === 'ADMIN';
};
