/**
 * This file exposes the structured logger used by the backend.
 * It exists to keep request logs, AI decisions, blockchain activity and errors in one consistent format.
 * It fits the system by giving the application production-ready observability from the start.
 */
import pino from "pino";
import pinoHttp from "pino-http";

import { env } from "./env";

/**
 * This constant defines the shared backend logger instance.
 * It receives no direct runtime input beyond the validated environment.
 * It returns a configured pino logger.
 * It is important because all backend services should emit structured logs with the same redaction rules.
 */
export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  name: env.APP_NAME,
  redact: {
    paths: [
      "req.headers.authorization",
      "headers.authorization",
      "privateKey",
      "signature",
      "signedTransaction"
    ],
    remove: true
  }
});

/**
 * This function creates the HTTP request logger middleware used by Express.
 * It receives no parameters because it is fully configured from the shared logger instance.
 * It returns a pino-http middleware function.
 * It is important because correlating request, AI and blockchain logs is critical for debugging and demos.
 */
export function createHttpLogger() {
  return pinoHttp({
    logger,
    customSuccessMessage(request, response) {
      return `${request.method} ${request.url} completed with ${response.statusCode}`;
    },
    customErrorMessage(request, response, error) {
      return `${request.method} ${request.url} failed with ${response.statusCode}: ${error.message}`;
    }
  });
}
