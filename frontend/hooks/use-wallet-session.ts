/**
 * This file implements the wallet connection and backend-auth session hook for the demo frontend.
 * It exists to isolate connect, switch, sign and JWT persistence concerns from UI components.
 * It fits the system by giving the demo one reusable wallet-auth controller surface.
 */
"use client";

import { useEffect, useState } from "react";
import { avalancheFuji } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSwitchChain
} from "wagmi";

import { createWalletChallenge, verifyWalletSignature } from "@/services/timelend-api";
import type { WalletSession } from "@/types/frontend";

const SESSION_STORAGE_KEY = "timelend-demo-wallet-session";

type WalletSessionHook = {
  address: string | undefined;
  authenticateWallet: () => Promise<void>;
  chainId: number | undefined;
  connectWallet: () => Promise<void>;
  connectorName: string | null;
  disconnectWallet: () => void;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isOnSupportedChain: boolean;
  session: WalletSession | null;
  sessionError: string | null;
  switchToSupportedChain: () => Promise<void>;
};

/**
 * This hook manages the complete wallet connection and JWT auth lifecycle for the demo.
 * It receives no arguments because all state comes from wagmi and browser storage.
 * It returns connection state, auth state and imperative actions used by the UI.
 * It is important because most frontend flows require both a connected wallet and a backend token.
 */
export function useWalletSession(): WalletSessionHook {
  const { address, chain, connector, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const [session, setSession] = useState<WalletSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * This effect restores the previous backend session from browser storage after hydration.
   * It receives no explicit inputs because the storage key is static.
   * It returns no cleanup because the initialization is one-shot.
   * It is important because the demo should not force a fresh signature on every reload.
   */
  useEffect(() => {
    const storedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (storedSession === null) {
      return;
    }

    try {
      setSession(JSON.parse(storedSession) as WalletSession);
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, []);

  /**
   * This effect clears stale sessions whenever the connected wallet changes away from the stored session.
   * It receives the current connected address and the stored wallet session.
   * It returns no cleanup because it only synchronizes local state.
   * It is important because one wallet should never accidentally reuse another wallet's JWT.
   */
  useEffect(() => {
    if (!isConnected || address === undefined) {
      return;
    }

    if (
      session !== null &&
      session.walletAddress.toLowerCase() !== address.toLowerCase()
    ) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
    }
  }, [address, isConnected, session]);

  /**
   * This function connects the first available injected wallet connector.
   * It receives no explicit parameters because the connector list comes from wagmi.
   * It returns a promise that resolves after the wallet connection completes.
   * It is important because the demo must support MetaMask or any compatible injected provider.
   */
  async function connectWallet() {
    const preferredConnector = connectors[0];

    if (preferredConnector === undefined) {
      throw new Error("No injected wallet connector is available in this browser.");
    }

    setSessionError(null);
    await connectAsync({
      connector: preferredConnector
    });
  }

  /**
   * This function clears the current wallet session and disconnects the wallet connector.
   * It receives no parameters because all state is already local to the hook.
   * It returns nothing because the disconnect is synchronous from the UI perspective.
   * It is important because demo users need a clear reset path between test runs.
   */
  function disconnectWallet() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setSessionError(null);
    disconnect();
  }

  /**
   * This function requests a backend challenge, signs it with the wallet and stores the resulting JWT.
   * It receives no parameters because it acts on the currently connected wallet.
   * It returns a promise that resolves after the session is stored locally.
   * It is important because every protected backend endpoint requires this authenticated session.
   */
  async function authenticateWallet() {
    if (address === undefined) {
      throw new Error("Connect a wallet before authenticating.");
    }

    setIsAuthenticating(true);
    setSessionError(null);

    try {
      const challenge = await createWalletChallenge(address);
      const signature = await signMessageAsync({
        message: challenge.message
      });
      const verifiedSession = await verifyWalletSignature(address, signature);
      const nextSession: WalletSession = {
        token: verifiedSession.token,
        walletAddress: verifiedSession.walletAddress
      };

      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet authentication failed.";
      setSessionError(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }

  /**
   * This function switches the connected wallet to Avalanche Fuji.
   * It receives no parameters because the target chain is fixed by the project.
   * It returns a promise that resolves after the wallet switch request completes.
   * It is important because the createCommitment contract call must target the same chain as the backend and contract deployment.
   */
  async function switchToSupportedChain() {
    await switchChainAsync({
      chainId: avalancheFuji.id
    });
  }

  const isOnSupportedChain = chain?.id === avalancheFuji.id;
  const isAuthenticated =
    session !== null &&
    address !== undefined &&
    session.walletAddress.toLowerCase() === address.toLowerCase();

  return {
    address,
    authenticateWallet,
    chainId: chain?.id,
    connectWallet,
    connectorName: connector?.name ?? null,
    disconnectWallet,
    isAuthenticated,
    isAuthenticating,
    isConnected,
    isConnecting,
    isOnSupportedChain,
    session,
    sessionError,
    switchToSupportedChain
  };
}
