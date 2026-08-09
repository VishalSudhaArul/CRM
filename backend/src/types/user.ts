export type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}