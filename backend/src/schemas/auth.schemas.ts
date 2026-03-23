/**
 * This file stores Zod schemas for wallet authentication endpoints.
 * It exists to keep auth request validation explicit and reusable across routes.
 * It fits the system by ensuring the wallet auth flow starts from validated inputs.
 */
import { z } from "zod";

const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

/**
 * This schema validates the request body used to create a wallet challenge.
 * It receives untrusted HTTP input.
 * It returns a typed challenge request payload when validation succeeds.
 * It is important because signature verification is only meaningful for valid wallet addresses.
 */
export const authChallengeBodySchema = z.object({
  walletAddress: walletAddressSchema
});

/**
 * This schema validates the request body used to verify a signed challenge.
 * It receives untrusted HTTP input.
 * It returns a typed signature verification payload when validation succeeds.
 * It is important because malformed signatures should be rejected before they reach the auth service.
 */
export const verifySignatureBodySchema = z.object({
  signature: z.string().min(1),
  walletAddress: walletAddressSchema
});
