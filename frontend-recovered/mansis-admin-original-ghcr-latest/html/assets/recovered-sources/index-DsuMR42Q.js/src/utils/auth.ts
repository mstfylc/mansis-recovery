import { tokenDecoder } from './jwt';

/**
 * Checks if the given token is expired
 * @param token JWT token string
 * @returns true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;

  const decoded = tokenDecoder(token);
  if (!decoded) return true;

  const expirationTime = decoded.exp * 1000; // convert to milliseconds
  const currentTime = Date.now();

  return currentTime >= expirationTime;
};

/**
 * Validates a token by checking if it exists and is not expired
 * @param token JWT token string
 * @returns true if token is valid and not expired, false otherwise
 */
export const validateToken = (token: string | null): boolean => {
  if (!token) return false;
  return !isTokenExpired(token);
};

/**
 * Get the expiration time in milliseconds
 * @param token JWT token string
 * @returns Expiration time in milliseconds or 0 if token is invalid
 */
export const getTokenExpirationTime = (token: string): number => {
  const decoded = tokenDecoder(token);
  if (!decoded || !decoded.exp) return 0;

  return decoded.exp * 1000; // Convert to milliseconds
};
