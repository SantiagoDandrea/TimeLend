/**
 * This file implements the commitment dashboard data hook for the demo frontend.
 * It exists to keep polling, loading and refresh state separate from rendering.
 * It fits the system by giving the demo one clear read model for the authenticated wallet.
 */
"use client";

import { useEffect, useState } from "react";

import { listCommitments } from "@/services/timelend-api";
import type { ApiCommitment, WalletSession } from "@/types/frontend";

type CommitmentsDashboardState = {
  commitments: ApiCommitment[];
  dashboardError: string | null;
  initialLoadComplete: boolean;
  isRefreshing: boolean;
  refreshCommitments: () => Promise<void>;
};

const REFRESH_INTERVAL_MS = 5_000;

/**
 * This hook loads and refreshes the authenticated commitment dashboard.
 * It receives the current wallet session and connected wallet address.
 * It returns the current commitment list plus loading and refresh helpers.
 * It is important because verification and appeal resolution happen asynchronously and the UI must reflect them over time.
 */
export function useCommitmentsDashboard(
  session: WalletSession | null,
  walletAddress: string | undefined
): CommitmentsDashboardState {
  const [commitments, setCommitments] = useState<ApiCommitment[]>([]);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  /**
   * This function fetches the latest commitments for the authenticated wallet.
   * It receives no parameters because session and wallet address are already captured from hook state.
   * It returns a promise that resolves after local state is updated.
   * It is important because every action in the demo eventually needs a fresh dashboard refresh.
   */
  async function refreshCommitments() {
    if (session === null || walletAddress === undefined) {
      setCommitments([]);
      setDashboardError(null);
      setInitialLoadComplete(true);
      return;
    }

    setIsRefreshing(true);

    try {
      const nextCommitments = await listCommitments(session.token, walletAddress);
      setCommitments(nextCommitments);
      setDashboardError(null);
    } catch (error) {
      setDashboardError(
        error instanceof Error ? error.message : "Unable to load commitments."
      );
    } finally {
      setIsRefreshing(false);
      setInitialLoadComplete(true);
    }
  }

  /**
   * This effect starts polling while the wallet is authenticated and clears stale state otherwise.
   * It receives the current wallet session and address as dependencies.
   * It returns a cleanup function that stops the polling interval.
   * It is important because the demo needs to observe backend async state changes without manual refresh only.
   */
  useEffect(() => {
    if (session === null || walletAddress === undefined) {
      setCommitments([]);
      setDashboardError(null);
      setInitialLoadComplete(true);
      return;
    }

    void refreshCommitments();

    const intervalId = window.setInterval(() => {
      void refreshCommitments();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [session, walletAddress]);

  return {
    commitments,
    dashboardError,
    initialLoadComplete,
    isRefreshing,
    refreshCommitments
  };
}
