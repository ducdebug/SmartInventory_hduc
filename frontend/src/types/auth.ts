export type UserRole = 'ADMIN' | 'SUPPLIER' | 'BUYER';

export interface User {
  username: string;
  role: UserRole;
  img_url?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  role: UserRole;
}
