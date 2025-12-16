/**src/app/shared/models/user.model.ts
 * Modèle utilisateur
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  oauthProvider?: string | null;
  createdAt?: string;
  updatedAt?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
}

/**
 * Rôles utilisateur
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

// Profile étendu si nécessaire plus tard
