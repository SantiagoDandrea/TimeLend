/**
 * This file defines the internal API key middleware used for privileged backend-only routes.
 * It exists to protect operator and automation endpoints from end-user access.
 * It fits the system by giving internal workflows a separate trust boundary from normal wallet-authenticated requests.
 */
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { AppError } from "../utils/app-error";

/**
 * This function creates middleware that enforces the configured internal API key.
 * It receives no parameters because the expected secret is loaded from validated environment variables.
 * It returns an Express middleware function.
 * It is important because appeal resolution and operational jobs should not be callable by regular users.
 */
export function createInternalAuthMiddleware() {
  return (request: Request, _response: Response, next: NextFunction) => {
    const providedKey = request.headers["x-internal-api-key"];

    if (providedKey !== env.INTERNAL_API_KEY) {
      next(new AppError(403, "INTERNAL_FORBIDDEN", "Invalid internal API key."));
      return;
    }

    next();
  };
}
