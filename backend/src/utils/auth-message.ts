/**
 * This file builds the wallet-auth message signed by the user.
 * It exists to keep challenge generation deterministic and reproducible across auth requests.
 * It fits the system by making signature verification stable and easy to audit.
 */
/**
 * This function creates the wallet login challenge message.
 * It receives the wallet address and the server-generated nonce.
 * It returns the exact string the user must sign.
 * It is important because challenge replay protection depends on one canonical message format.
 */
export function buildWalletChallengeMessage(walletAddress: string, nonce: string) {
  return [
    "TimeLend Wallet Authentication",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    "",
    "By signing this message you prove ownership of the wallet and request a TimeLend session."
  ].join("\n");
}
