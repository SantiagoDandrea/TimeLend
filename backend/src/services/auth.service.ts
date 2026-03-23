/**
 * This file implements wallet challenge generation and signature verification.
 * It exists to keep authentication logic separate from HTTP controllers.
 * It fits the system by making wallet auth a reusable service instead of route-specific code.
 */
import crypto from "node:crypto";

import { prisma } from "@timelend/database";
import { getAddress, verifyMessage } from "ethers";

import { env } from "../config/env";
import { logger } from "../config/logger";
import type { WalletChallengePayload } from "../types/auth";
import { buildWalletChallengeMessage } from "../utils/auth-message";
import { AppError } from "../utils/app-error";
import type { TokenService } from "./token.service";

export class AuthService {
  /**
   * This constructor wires the auth service with the token service dependency.
   * It receives the token service used to issue JWTs after a successful signature check.
   * It returns an AuthService instance.
   * It is important because the auth flow ends by creating a session token for the verified wallet.
   */
  constructor(private readonly tokenService: TokenService) {}

  /**
   * This function creates and persists a new wallet auth challenge.
   * It receives the wallet address that wants to authenticate.
   * It returns the signed challenge payload that should be presented to the user.
   * It is important because each login must be protected from replay by a fresh nonce.
   */
  async createChallenge(walletAddress: string): Promise<WalletChallengePayload> {
    const normalizedWalletAddress = getAddress(walletAddress);
    const nonce = crypto.randomUUID();

    await prisma.user.upsert({
      create: {
        authNonce: nonce,
        authNonceIssuedAt: new Date(),
        walletAddress: normalizedWalletAddress
      },
      update: {
        authNonce: nonce,
        authNonceIssuedAt: new Date()
      },
      where: {
        walletAddress: normalizedWalletAddress
      }
    });

    logger.info(
      {
        walletAddress: normalizedWalletAddress
      },
      "Wallet auth challenge issued"
    );

    return {
      message: buildWalletChallengeMessage(normalizedWalletAddress, nonce),
      nonce,
      walletAddress: normalizedWalletAddress
    };
  }

  /**
   * This function verifies the signed wallet challenge and issues a JWT.
   * It receives the wallet address and the signature returned by the client.
   * It returns the JWT plus the normalized wallet address.
   * It is important because the rest of the backend trusts this function to establish wallet identity.
   */
  async verifySignature(walletAddress: string, signature: string) {
    const normalizedWalletAddress = getAddress(walletAddress);
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedWalletAddress
      }
    });

    if (user === null || typeof user.authNonce !== "string") {
      throw new AppError(
        400,
        "AUTH_CHALLENGE_MISSING",
        "Challenge not found for the provided wallet."
      );
    }

    if (
      user.authNonceIssuedAt === null ||
      Date.now() - user.authNonceIssuedAt.getTime() >
        env.AUTH_CHALLENGE_TTL_MINUTES * 60 * 1_000
    ) {
      throw new AppError(401, "AUTH_CHALLENGE_EXPIRED", "The wallet challenge has expired.");
    }

    const expectedMessage = buildWalletChallengeMessage(normalizedWalletAddress, user.authNonce);
    const recoveredAddress = getAddress(verifyMessage(expectedMessage, signature));

    if (recoveredAddress !== normalizedWalletAddress) {
      throw new AppError(401, "AUTH_SIGNATURE_INVALID", "Signature verification failed.");
    }

    const rotatedNonce = crypto.randomUUID();

    const updatedUser = await prisma.user.update({
      data: {
        authNonce: rotatedNonce,
        authNonceIssuedAt: new Date()
      },
      where: {
        id: user.id
      }
    });

    const token = this.tokenService.createToken(updatedUser.id, updatedUser.walletAddress);

    logger.info(
      {
        userId: updatedUser.id,
        walletAddress: updatedUser.walletAddress
      },
      "Wallet signature verified"
    );

    return {
      token,
      walletAddress: updatedUser.walletAddress
    };
  }
}
