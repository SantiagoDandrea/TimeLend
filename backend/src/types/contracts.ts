/**
 * This file stores blockchain-specific types used by the backend contract service.
 * It exists to keep contract interactions decoupled from HTTP payloads and Prisma entities.
 * It fits the system by giving on-chain operations a small, explicit contract surface.
 */
export type OnChainCommitmentSnapshot = {
  amount: string;
  appealWindowEndsAt: Date | null;
  appealed: boolean;
  deadline: Date;
  failReceiver: string;
  failureMarkedAt: Date | null;
  payoutState: number;
  status: number;
  user: string;
};

export type PreparedUserTransaction = {
  chainId: number;
  data: string;
  to: string;
  value: string;
};

export type CreateCommitmentOnChainInput = {
  amountWei: string;
  deadlineUnix: number;
  failReceiver: string;
  signedTransaction: string;
  walletAddress: string;
};

export type CreateCommitmentOnChainResult = {
  commitmentId: bigint;
  txHash: string;
};

export type AppealOnChainInput = {
  onchainId: bigint;
  signedTransaction: string;
  walletAddress: string;
};

export type AppealOnChainResult = {
  txHash: string;
};

export type ResolutionOnChainResult = {
  appealWindowEndsAt?: Date;
  txHash: string;
};
