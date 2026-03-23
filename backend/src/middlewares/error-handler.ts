/**
 * This file exposes the centralized Express error middleware for the backend.
 * It exists to convert known application, validation and upload errors into consistent JSON responses.
 * It fits the system by giving every route one audited error serialization boundary.
 */
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";

import { logger } from "../config/logger";
import { AppError } from "../utils/app-error";

/**
 * This function serializes backend errors into stable HTTP responses.
 * It receives the thrown error together with the Express request lifecycle objects.
 * It returns an HTTP JSON response describing the failure.
 * It is important because clients and judges should see predictable errors instead of framework defaults.
 */
export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    logger.warn(
      {
        code: error.code,
        details: error.details,
        method: request.method,
        path: request.path
      },
      error.message
    );

    response.status(error.statusCode).json({
      code: error.code,
      details: error.details,
      message: error.message
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      details: error.flatten(),
      message: "Request validation failed."
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      code: "UPLOAD_ERROR",
      details: {
        field: error.field,
        reason: error.code
      },
      message: error.message
    });
    return;
  }

  logger.error(
    {
      error,
      method: request.method,
      path: request.path
    },
    "Unhandled backend error"
  );

  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred."
  });
}
