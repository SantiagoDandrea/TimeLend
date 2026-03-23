/**
 * This file exposes a small wrapper for async Express handlers.
 * It exists to keep controllers concise without repeating try/catch blocks.
 * It fits the system by forwarding rejected promises into the centralized error middleware.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * This function wraps an async Express handler and forwards rejections to next().
 * It receives an async request handler.
 * It returns a standard Express request handler.
 * It is important because almost every controller method in the backend performs asynchronous work.
 */
export function asyncHandler(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
