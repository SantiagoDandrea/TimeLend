/**
 * This file exposes reusable Zod-based validation middleware.
 * It exists to keep request validation out of controllers and make input contracts explicit.
 * It fits the system by ensuring every HTTP entry point validates payloads before business logic runs.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AnyZodObject, ZodTypeAny } from "zod";
import { ZodError } from "zod";

/**
 * This function creates an Express middleware that validates a selected request segment with Zod.
 * It receives a schema and the request segment name to validate.
 * It returns an Express middleware function.
 * It is important because controllers should only receive already-validated input.
 */
export function validateRequest<TSchema extends ZodTypeAny>(
  schema: TSchema,
  target: "body" | "params" | "query"
): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      request[target] = schema.parse(request[target]) as Request[typeof target];
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * This function creates a middleware that validates body, params and query together when needed.
 * It receives an object containing any combination of Zod schemas for the request segments.
 * It returns an Express middleware function.
 * It is important because some routes need coordinated validation across multiple request segments.
 */
export function validateCompositeRequest(schemas: {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (schemas.body !== undefined) {
        request.body = schemas.body.parse(request.body);
      }

      if (schemas.params !== undefined) {
        request.params = schemas.params.parse(request.params);
      }

      if (schemas.query !== undefined) {
        request.query = schemas.query.parse(request.query) as Request["query"];
      }

      next();
    } catch (error) {
      next(error instanceof ZodError ? error : new ZodError([]));
    }
  };
}
