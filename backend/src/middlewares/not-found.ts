/**
 * This file exposes the catch-all 404 middleware for the backend.
 * It exists to convert unmatched routes into a consistent JSON payload.
 * It fits the system by ensuring frontend and operators never receive opaque HTML fallback responses.
 */
import type { NextFunction, Request, Response } from "express";

/**
 * This function returns a JSON 404 response for any unmatched route.
 * It receives the Express request and response objects plus the next callback.
 * It returns an HTTP JSON payload describing the missing route.
 * It is important because every API consumer should get a consistent machine-readable miss response.
 */
export function notFoundMiddleware(request: Request, response: Response, _next: NextFunction) {
  response.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: `No route matched ${request.method} ${request.originalUrl}.`
  });
}
