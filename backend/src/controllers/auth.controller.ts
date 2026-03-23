/**
 * This file exposes the wallet-auth HTTP controllers.
 * It exists to translate validated auth requests into service calls and HTTP responses.
 * It fits the system by keeping signature verification transport concerns out of the auth service itself.
 */
import type { Request, Response } from "express";

import type { AuthService } from "../services/auth.service";

/**
 * This class groups the HTTP handlers for wallet authentication.
 * It receives the auth service as an explicit dependency.
 * It returns controller methods ready for Express routing.
 * It is important because wallet auth is the entry point to every protected backend workflow.
 */
export class AuthController {
  /**
   * This constructor wires the controller to the auth service.
   * It receives the auth service used to generate challenges and verify signatures.
   * It returns an AuthController instance.
   * It is important because the controller should stay transport-focused and delegate business logic.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * This function creates a fresh wallet challenge for the provided address.
   * It receives the Express request and response objects.
   * It returns an HTTP JSON payload containing the challenge message and nonce.
   * It is important because replay-safe wallet login starts with a server-issued nonce.
   */
  createChallenge = async (request: Request, response: Response) => {
    const challenge = await this.authService.createChallenge(request.body.walletAddress);
    response.status(200).json(challenge);
  };

  /**
   * This function verifies a signed wallet challenge and returns the session token.
   * It receives the Express request and response objects.
   * It returns an HTTP JSON payload containing the JWT and normalized wallet address.
   * It is important because downstream routes depend on this token-based authenticated context.
   */
  verifySignature = async (request: Request, response: Response) => {
    const verification = await this.authService.verifySignature(
      request.body.walletAddress,
      request.body.signature
    );

    response.status(200).json(verification);
  };
}
