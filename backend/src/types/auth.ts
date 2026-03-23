/**
 * This file stores authentication-related backend types.
 * It exists to keep wallet auth, JWT payloads and request context contracts explicit.
 * It fits the system by making auth wiring predictable across middleware, services and controllers.
 */
export type AuthenticatedUserContext = {
  token: string;
  userId: string;
  walletAddress: string;
};

export type WalletChallengePayload = {
  message: string;
  nonce: string;
  walletAddress: string;
};

export type WalletTokenPayload = {
  walletAddress: string;
};
