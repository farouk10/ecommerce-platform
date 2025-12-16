import { User } from './user.model';

/**
 * Requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Requête d'inscription
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Réponse d'authentification
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

/**
 * Tokens JWT
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
