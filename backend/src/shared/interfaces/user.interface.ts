export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
}