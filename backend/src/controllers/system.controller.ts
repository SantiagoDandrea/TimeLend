/**
 * This file exposes the HTTP controllers for backend system routes.
 * It exists to translate service results into Express responses.
 * It fits the system by keeping the transport layer separate from reusable business logic.
 */
import type { Request, Response } from "express";

import type { SystemService } from "../services/system.service";

/**
 * This class groups the system HTTP handlers.
 * It receives the system service as an explicit dependency.
 * It returns controller methods ready for Express routing.
 * It is important because even simple health routes should follow the same layering rules as domain routes.
 */
export class SystemController {
  /**
   * This constructor wires the controller to the system service.
   * It receives the system service used to build readiness and version payloads.
   * It returns a SystemController instance.
   * It is important because the controller should only adapt transport concerns.
   */
  constructor(private readonly systemService: SystemService) {}

  /**
   * This function answers the backend health endpoint.
   * It receives the Express request and response objects.
   * It returns an HTTP JSON response with readiness metadata.
   * It is important because infrastructure and local development depend on a simple health check.
   */
  getHealth = (_request: Request, response: Response) => {
    response.status(200).json(this.systemService.buildHealthResponse());
  };

  /**
   * This function answers the backend version endpoint.
   * It receives the Express request and response objects.
   * It returns an HTTP JSON response with version metadata.
   * It is important because deploy verification and future clients need API version visibility.
   */
  getVersion = (_request: Request, response: Response) => {
    response.status(200).json(this.systemService.buildVersionResponse());
  };
}
