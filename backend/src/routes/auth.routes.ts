/**
 * This file registers the wallet-auth routes for the backend.
 * It exists to keep auth endpoint wiring close to the validation rules and controller methods it uses.
 * It fits the system by making authentication a cleanly isolated module.
 */
import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import type { AuthController } from "../controllers/auth.controller";
import { authChallengeBodySchema, verifySignatureBodySchema } from "../schemas/auth.schemas";
import { asyncHandler } from "../utils/async-handler";
import { validateRequest } from "../middlewares/validate";

/**
 * This function creates the router for wallet authentication endpoints.
 * It receives the auth controller instance for this process.
 * It returns an Express router with challenge and signature verification routes.
 * It is important because authentication should be mounted as a distinct API surface.
 */
export function createAuthRouter(authController: AuthController): ExpressRouter {
  const router = Router();

  router.post(
    "/challenge",
    validateRequest(authChallengeBodySchema, "body"),
    asyncHandler(authController.createChallenge)
  );
  router.post(
    "/verify-signature",
    validateRequest(verifySignatureBodySchema, "body"),
    asyncHandler(authController.verifySignature)
  );

  return router;
}
