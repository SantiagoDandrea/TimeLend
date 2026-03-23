/**
 * This file augments the Express request type with authenticated user context.
 * It exists so auth middleware can attach wallet identity without unsafe casts everywhere.
 * It fits the system by giving controllers a typed request surface after authentication succeeds.
 */
import type { AuthenticatedUserContext } from "./auth";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUserContext;
    }
  }
}

export {};
