/**
 * This file renders the main dashboard for authenticated users.
 * It shows active and past commitments with full interaction capabilities.
 * It fits the system by being the primary view after wallet connection.
 */
"use client";

import { useState } from "react";
import { formatEther } from "viem";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

import {
  buildDeadlineFromDateOnly,
  formatDateOnly,
  getFailReceiverValidationError,
  resolveEffectiveFailReceiver,
} from "@/lib/commitment-utils";
import { getFrontendRuntimeConfig } from "@/lib/env";
import { useCommitmentsDashboard } from "@/hooks/use-commitments-dashboard";
import { useTimeLendWalletActions } from "@/hooks/use-timelend-wallet-actions";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  createCommitmentRecord,
  finalizeFailedDemo,
  recordAppeal,
  resolveAppealDemo,
  uploadEvidence,
  verifyCommitmentRequest,
} from "@/services/timelend-api";
import type {
  ApiCommitment,
  CreateCommitmentFormValues,
  EvidenceSubmissionInput,
} from "@/types/frontend";
import { DashboardCommitmentCard } from "@/components/dashboard-commitment-card";

type DashboardProps = {
  onCreateNew: () => void;
};

/**
 * This component renders the main dashboard view with all commitments.
 * It receives a callback for navigating to the create flow.
 * It returns the full dashboard UI with active and past commitments.
 * It is important because it's the primary interface for managing commitments.
 */
export function Dashboard({ onCreateNew }: DashboardProps) {
  const runtimeConfig = getFrontendRuntimeConfig();
  const {
    address,
    isAuthenticated,
    isOnSupportedChain,
    session,
    switchToSupportedChain,
  } = useWalletSession();
  const { appealCommitmentWithWallet, createCommitmentWithWallet, walletReady } =
    useTimeLendWalletActions();
  const { commitments, dashboardError, initialLoadComplete, isRefreshing, refreshCommitments } =
    useCommitmentsDashboard(session, isAuthenticated ? address : undefined);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Separate commitments into active and past
  const activeCommitments = commitments.filter(
    (c) => c.status === "ACTIVE" || c.status === "FAILED_PENDING_APPEAL"
  );
  const pastCommitments = commitments.filter(
    (c) => c.status === "COMPLETED" || c.status === "FAILED_FINAL"
  );

  // Calculate stats
  const totalStaked = commitments.reduce((sum, c) => sum + BigInt(c.amount), BigInt(0));
  const completedCount = commitments.filter((c) => c.status === "COMPLETED").length;
  const activeCount = activeCommitments.length;

  async function handleUploadEvidence(commitmentId: string, input: EvidenceSubmissionInput) {
    if (session === null) {
      throw new Error("Authenticate before uploading evidence.");
    }

    await uploadEvidence(session.token, commitmentId, input);
    await refreshCommitments();
  }

  async function handleVerify(commitmentId: string) {
    if (session === null) {
      throw new Error("Authenticate before verifying commitments.");
    }

    const response = await verifyCommitmentRequest(session.token, commitmentId);
    setPageMessage(response.message);
    await refreshCommitments();
  }

  async function handleAppeal(commitment: ApiCommitment) {
    if (session === null || address === undefined) {
      throw new Error("Authenticate a wallet before appealing.");
    }

    if (!isOnSupportedChain) {
      throw new Error("Switch to Avalanche Fuji before appealing.");
    }

    const appealTxHash = await appealCommitmentWithWallet(address, commitment.onchainId);
    await recordAppeal(session.token, commitment.id, appealTxHash);
    setPageMessage(`Appeal recorded for commitment ${commitment.onchainId}.`);
    await refreshCommitments();
  }

  async function handleResolveAppeal(commitmentId: string) {
    const commitment = await resolveAppealDemo(commitmentId);
    setPageMessage(
      `Appeal resolved. Commitment ${commitment.onchainId} is now ${commitment.status}.`
    );
    await refreshCommitments();
  }

  async function handleFinalize(commitmentId: string) {
    await finalizeFailedDemo(commitmentId);
    setPageMessage("Failed commitment finalization requested.");
    await refreshCommitments();
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--tl-success)]/10">
              <CheckCircle2 className="h-5 w-5 text-[var(--tl-success)]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{commitments.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <svg
                className="h-5 w-5 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Staked</p>
              <p className="text-2xl font-bold text-foreground">
                {parseFloat(formatEther(totalStaked)).toFixed(3)} AVAX
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {pageMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--tl-success)]/30 bg-[var(--tl-success-muted)] p-4">
          <CheckCircle2 className="h-5 w-5 text-[var(--tl-success)]" />
          <p className="text-sm text-[var(--tl-success)]">{pageMessage}</p>
          <button
            onClick={() => setPageMessage(null)}
            className="ml-auto text-[var(--tl-success)] hover:opacity-70"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {dashboardError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--tl-danger)]/30 bg-[var(--tl-danger-muted)] p-4">
          <AlertCircle className="h-5 w-5 text-[var(--tl-danger)]" />
          <p className="text-sm text-[var(--tl-danger)]">{dashboardError}</p>
        </div>
      )}

      {/* Chain Warning */}
      {isAuthenticated && !isOnSupportedChain && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[var(--tl-warning)]/30 bg-[var(--tl-warning-muted)] p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--tl-warning)]" />
            <p className="text-sm text-[var(--tl-warning)]">
              Please switch to Avalanche Fuji network to interact with commitments.
            </p>
          </div>
          <button
            onClick={() => void switchToSupportedChain()}
            className="rounded-lg bg-[var(--tl-warning)] px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Switch Network
          </button>
        </div>
      )}

      {/* Active Commitments Section */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Active Commitments</h2>
            <p className="text-sm text-muted-foreground">
              Commitments that are pending or awaiting verification
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void refreshCommitments()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Commitment
            </button>
          </div>
        </div>

        {!initialLoadComplete ? (
          <div className="glass-card flex items-center justify-center rounded-2xl p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeCommitments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No Active Commitments</h3>
            <p className="mb-6 text-muted-foreground">
              You don't have any active commitments yet. Create one to get started!
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              Create Your First Commitment
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeCommitments.map((commitment) => (
              <DashboardCommitmentCard
                key={commitment.id}
                commitment={commitment}
                onAppeal={handleAppeal}
                onFinalize={handleFinalize}
                onResolveAppeal={handleResolveAppeal}
                onUploadEvidence={handleUploadEvidence}
                onVerify={handleVerify}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Commitments Section */}
      {pastCommitments.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">Past Commitments</h2>
            <p className="text-sm text-muted-foreground">
              Commitments that have been completed or finalized
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pastCommitments.map((commitment) => (
              <div
                key={commitment.id}
                className="glass-card rounded-2xl p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{commitment.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {commitment.description}
                    </p>
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      commitment.status === "COMPLETED"
                        ? "status-completed"
                        : "status-failed_final"
                    }`}
                  >
                    {commitment.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {commitment.status === "COMPLETED" ? "Completed" : "Failed"}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {formatEther(BigInt(commitment.amount))} AVAX
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDateOnly(commitment.deadline)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contract Info */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        Contract: {runtimeConfig.NEXT_PUBLIC_CONTRACT_ADDRESS}
      </div>
    </div>
  );
}
