/**
 * This file implements the browser-side contract actions used by the demo frontend.
 * It exists to isolate viem wallet/public client interactions from UI components.
 * It fits the system by keeping the only user-owned contract actions in one hook.
 */
"use client";

import { getAddress, type Address } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

import { getFrontendRuntimeConfig } from "@/lib/env";
import {
  createCommitmentOnChain,
  requestAppealOnChain
} from "@/services/timelend-contract";

type CreateCommitmentOnChainInput = {
  amountAvax: string;
  deadlineUnix: bigint;
  failReceiver: string;
  walletAddress: string;
};

/**
 * This hook exposes the contract actions performed directly by the connected wallet.
 * It receives no parameters because wallet/public clients are derived from wagmi state.
 * It returns imperative helpers used by the demo flow.
 * It is important because createCommitment and appeal depend on the user's own wallet signature.
 */
export function useTimeLendWalletActions() {
  const runtimeConfig = getFrontendRuntimeConfig();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const contractAddress = getAddress(runtimeConfig.NEXT_PUBLIC_CONTRACT_ADDRESS) as Address;

  /**
   * This function creates a commitment on-chain through the connected wallet.
   * It receives the amount, deadline, fail receiver and current wallet address.
   * It returns the mined transaction hash and emitted on-chain commitment id.
   * It is important because the backend only persists the commitment after this escrow transaction exists.
   */
  async function createCommitmentWithWallet(input: CreateCommitmentOnChainInput) {
    if (walletClient === undefined || publicClient === undefined) {
      throw new Error("Wallet client is not ready yet.");
    }

    return createCommitmentOnChain(walletClient, publicClient, {
      amountAvax: input.amountAvax,
      contractAddress,
      deadlineUnix: input.deadlineUnix,
      failReceiver: input.failReceiver,
      walletAddress: getAddress(input.walletAddress) as Address
    });
  }

  /**
   * This function requests the on-chain appeal using the connected wallet.
   * It receives the wallet address and the on-chain commitment id to appeal.
   * It returns the mined appeal transaction hash.
   * It is important because the current backend only records appeals after the user has consumed the on-chain appeal path.
   */
  async function appealCommitmentWithWallet(walletAddress: string, onchainId: string) {
    if (walletClient === undefined || publicClient === undefined) {
      throw new Error("Wallet client is not ready yet.");
    }

    return requestAppealOnChain(
      walletClient,
      publicClient,
      contractAddress,
      getAddress(walletAddress) as Address,
      onchainId
    );
  }

  return {
    appealCommitmentWithWallet,
    createCommitmentWithWallet,
    walletReady: walletClient !== undefined && publicClient !== undefined
  };
}
