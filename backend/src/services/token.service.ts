/**
 * This file implements JWT token creation and verification for wallet-authenticated requests.
 * It exists to keep token logic separate from auth controllers and services.
 * It fits the system by giving the backend one clear way to issue and verify session tokens.
 */
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import type { AuthenticatedUserContext, WalletTokenPayload } from "../types/auth";
import { AppError } from "../utils/app-error";

export class TokenService {
  /**
   * This function creates a JWT for an authenticated wallet user.
   * It receives the user id and normalized wallet address.
   * It returns the signed JWT string.
   * It is important because authenticated API calls should not require signature verification on every request.
   */
  createToken(userId: string, walletAddress: string) {
    return jwt.sign(
      {
        walletAddress
      } satisfies WalletTokenPayload,
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
        subject: userId
      }
    );
  }

  /**
   * This function verifies a bearer token and returns the authenticated request context.
   * It receives the raw JWT string from the Authorization header.
   * It returns the authenticated user context used by protected routes.
   * It is important because every protected route depends on a safe token verification boundary.
   */
  verifyToken(token: string): AuthenticatedUserContext {
    const decodedToken = jwt.verify(token, env.JWT_SECRET) as JwtPayload & WalletTokenPayload;

    if (typeof decodedToken.sub !== "string") {
      throw new AppError(401, "AUTH_INVALID", "Token subject is missing.");
    }

    return {
      token,
      userId: decodedToken.sub,
      walletAddress: decodedToken.walletAddress
    };
  }
}
