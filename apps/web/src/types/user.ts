export type UserRole = 'CUSTOMER' | 'OPERATOR' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  shopId?: string;
  createdAt: string;
}
