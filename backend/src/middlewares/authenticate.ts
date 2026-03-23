/**
 * This file defines the JWT authentication middleware for wallet-authenticated requests.
 * It exists to keep token verification separate from controllers.
 * It fits the system by enforcing identity consistently across commitment and evidence routes.
 */
import type { NextFunction, Request, Response } from "express";

import type { TokenService } from "../services/token.service";
import { AppError } from "../utils/app-error";

/**
 * This function creates the authentication middleware backed by the token service.
 * It receives the token service used to validate bearer tokens.
 * It returns an Express middleware function.
 * It is important because authenticated wallet context is required by most user routes.
 */
export function createAuthenticationMiddleware(tokenService: TokenService) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader === undefined || !authorizationHeader.startsWith("Bearer ")) {
      next(new AppError(401, "AUTH_MISSING", "Missing bearer token."));
      return;
    }

    const token = authorizationHeader.replace("Bearer ", "").trim();

    try {
      request.auth = tokenService.verifyToken(token);
      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError(401, "AUTH_INVALID", "Invalid authentication token.")
      );
    }
  };
}
