export type UserRole = 'ADMIN' | 'SUPPLIER' | 'TEMPORARY';

export interface User {
  id?: string;
  username: string;
  role: UserRole;
  name?: string;
  email?: string;
  company?: string;
  enabled?: boolean;
  deleted?: boolean;
  related_userID?: string;
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
