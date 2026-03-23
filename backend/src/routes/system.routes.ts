/**
 * This file declares the public system routes for the backend scaffold.
 * It exists to keep endpoint registration close to the controller it exposes.
 * It fits the system by giving future modules a predictable route-registration pattern.
 */
import { Router } from "express";
import type { Router as ExpressRouter } from "express";

import type { SystemController } from "../controllers/system.controller";

/**
 * This function creates the router that serves backend system endpoints.
 * It receives the system controller instance for the current runtime.
 * It returns an Express router instance.
 * It is important because it isolates the public status surface from future domain routes.
 */
export function createSystemRouter(systemController: SystemController): ExpressRouter {
  const router = Router();

  router.get("/health", systemController.getHealth);
  router.get("/version", systemController.getVersion);

  return router;
}
