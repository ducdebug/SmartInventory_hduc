export type UserRole = 'ADMIN' | 'SUPPLIER' | 'BUYER';

export interface User {
  username: string;
  role: UserRole;
}

// For login form
export interface LoginCredentials {
  username: string;
  password: string;
}

// For register form
export interface RegisterData {
  username: string;
  password: string;
  role: UserRole;
}
