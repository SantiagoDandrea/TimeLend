"use client";

import Link from "next/link";
import { useState } from "react";
import { formatEther } from "viem";

import { CommitmentCard } from "@/components/commitment-card";
import { WalletSessionPanel } from "@/components/wallet-session-panel";
import { useCommitmentsDashboard } from "@/hooks/use-commitments-dashboard";
import { useTimeLendWalletActions } from "@/hooks/use-timelend-wallet-actions";
import { useWalletSession } from "@/hooks/use-wallet-session";
import {
  finalizeFailedDemo,
  recordAppeal,
  resolveAppealDemo,
  uploadEvidence,
  verifyCommitmentRequest,
} from "@/services/timelend-api";
import type { ApiCommitment, EvidenceSubmissionInput } from "@/types/frontend";

/**
 * This component renders the dedicated dashboard route using the existing commitment operations.
 * It receives no props because all dashboard and wallet state comes from the same hooks already used by the app.
 * It returns the dashboard page with wallet controls, summaries, and commitment actions.
 * It is important because the dashboard now has its own focused route without changing any underlying behavior.
 */
export function DashboardPageContent() {
  const {
    address,
    authenticateWallet,
    connectWallet,
    connectorName,
    disconnectWallet,
    isAuthenticated,
    isAuthenticating,
    isConnected,
    isConnecting,
    isOnSupportedChain,
    session,
    sessionError,
    switchToSupportedChain,
  } = useWalletSession();
  const { appealCommitmentWithWallet } = useTimeLendWalletActions();
  const { commitments, dashboardError, initialLoadComplete, isRefreshing, refreshCommitments } =
    useCommitmentsDashboard(session, isAuthenticated ? address : undefined);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const activeCommitments = commitments.filter(
    (commitment) => commitment.status !== "COMPLETED" && commitment.status !== "FAILED_FINAL",
  );
  const settledCommitments = commitments.filter(
    (commitment) => commitment.status === "COMPLETED" || commitment.status === "FAILED_FINAL",
  );
  const totalStakedWei = commitments.reduce(
    (accumulatedAmount, commitment) => accumulatedAmount + BigInt(commitment.amount),
    0n,
  );
  const processingCount = commitments.filter((commitment) => commitment.isProcessing).length;

  /**
   * This function uploads one evidence file for the selected commitment and refreshes the dashboard.
   * It receives the off-chain commitment id and the selected evidence input.
   * It returns a promise that resolves after the backend stores and parses the evidence.
   * It is important because evidence ingestion remains the same protected backend flow.
   */
  async function handleUploadEvidence(commitmentId: string, input: EvidenceSubmissionInput) {
    if (session === null) {
      throw new Error("Authenticate before uploading evidence.");
    }

    await uploadEvidence(session.token, commitmentId, input);
    await refreshCommitments();
  }

  /**
   * This function queues backend verification for the selected commitment and refreshes the dashboard.
   * It receives the off-chain commitment id.
   * It returns a promise that resolves after the verification request is accepted.
   * It is important because the dashboard must preserve the original verification path.
   */
  async function handleVerify(commitmentId: string) {
    if (session === null) {
      throw new Error("Authenticate before verifying commitments.");
    }

    const response = await verifyCommitmentRequest(session.token, commitmentId);
    setPageMessage(response.message);
    await refreshCommitments();
  }

  /**
   * This function consumes the on-chain appeal with the wallet and then records it in the backend.
   * It receives the selected commitment aggregate.
   * It returns a promise that resolves after both the chain and backend steps finish.
   * It is important because the appeal route must stay identical to the existing dashboard behavior.
   */
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

  /**
   * This function triggers the internal appeal-resolution path and refreshes the dashboard.
   * It receives the off-chain commitment id.
   * It returns a promise that resolves after the appeal outcome is available.
   * It is important because the page restructure must keep the same internal demo proxy behavior.
   */
  async function handleResolveAppeal(commitmentId: string) {
    const commitment = await resolveAppealDemo(commitmentId);
    setPageMessage(
      `Appeal resolved. Commitment ${commitment.onchainId} is now ${commitment.status}.`,
    );
    await refreshCommitments();
  }

  /**
   * This function triggers failed finalization for eligible commitments and refreshes the dashboard.
   * It receives the off-chain commitment id.
   * It returns a promise that resolves after the backend completes the request.
   * It is important because the dashboard must still expose the full failure-settlement path.
   */
  async function handleFinalize(commitmentId: string) {
    await finalizeFailedDemo(commitmentId);
    setPageMessage("Failed commitment finalization requested.");
    await refreshCommitments();
  }

  return (
    <main className="demo-shell page-shell">
      <div className="demo-orb demo-orb-secondary" aria-hidden="true" />

      <section className="hero-strip page-hero page-hero-compact">
        <div className="hero-main">
          <p className="section-label">Dashboard</p>
          <h1>Operate the full commitment pipeline.</h1>
          <p className="hero-copy">
            This page keeps the existing dashboard logic intact and gives the review workflow its
            own focused space for evidence, verification, appeal, and settlement.
          </p>
        </div>

        <aside className="hero-aside">
          <div className="hero-card-grid">
            <div className="metric-card metric-card-primary">
              <span>Active commitments</span>
              <strong>{activeCommitments.length}</strong>
              <small>Live, processing, and appeal-stage items.</small>
            </div>
            <div className="metric-card">
              <span>Settled commitments</span>
              <strong>{settledCommitments.length}</strong>
              <small>Completed or failed-final records already resolved.</small>
            </div>
            <div className="metric-card">
              <span>Total staked</span>
              <strong>{formatEther(totalStakedWei)} AVAX</strong>
              <small>Escrow value represented in the authenticated dashboard.</small>
            </div>
            <div className="metric-card">
              <span>Processing</span>
              <strong>{processingCount}</strong>
              <small>Commitments currently moving through automation.</small>
            </div>
          </div>

          <div className="hero-actions hero-actions-stack">
            <Link className="button button-secondary" href="/">
              Back home
            </Link>
            <Link className="button button-primary" href="/create">
              New commitment
            </Link>
          </div>
        </aside>
      </section>

      <WalletSessionPanel
        address={address}
        connectorName={connectorName}
        isAuthenticated={isAuthenticated}
        isAuthenticating={isAuthenticating}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isOnSupportedChain={isOnSupportedChain}
        onAuthenticate={authenticateWallet}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onSwitchChain={switchToSupportedChain}
        sessionError={sessionError}
      />

      <div className="notice-stack" aria-live="polite">
        {pageMessage !== null ? <p className="feedback feedback-success">{pageMessage}</p> : null}
        {dashboardError !== null ? <p className="feedback feedback-error">{dashboardError}</p> : null}
      </div>

      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="section-label">Overview</p>
            <h2 className="section-title">Your commitments</h2>
            <p className="muted-copy">
              Review current positions, submit evidence, and move each commitment through its
              allowed actions.
            </p>
          </div>

          <button
            className="button button-secondary"
            disabled={!isAuthenticated || isRefreshing}
            onClick={() => void refreshCommitments()}
            type="button"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="dashboard-summary">
          <div className="summary-pill">
            <span>Connected wallet</span>
            <strong>{address ?? "Not connected"}</strong>
          </div>
          <div className="summary-pill">
            <span>Authentication</span>
            <strong>{isAuthenticated ? "Session active" : "Pending"}</strong>
          </div>
          <div className="summary-pill">
            <span>Network</span>
            <strong>{isOnSupportedChain ? "Avalanche Fuji" : "Unsupported chain"}</strong>
          </div>
        </div>

        {!initialLoadComplete ? (
          <p className="empty-state">Loading dashboard...</p>
        ) : !isAuthenticated ? (
          <div className="empty-state-card">
            <p className="empty-state-title">Authenticate to load commitments</p>
            <p className="empty-state">
              The dashboard logic is unchanged. Connect your wallet and sign the session challenge
              above to unlock commitment data and actions.
            </p>
          </div>
        ) : commitments.length === 0 ? (
          <div className="empty-state-card">
            <p className="empty-state-title">No commitments found</p>
            <p className="empty-state">
              This route is ready. Create a new commitment first, then come back here to upload
              evidence and run the verification flow.
            </p>
          </div>
        ) : (
          <div className="dashboard-sections">
            <section className="commitment-section">
              <div className="section-row">
                <div>
                  <p className="section-label">Open pipeline</p>
                  <h3 className="subsection-title">Active, processing, and appeal-stage</h3>
                </div>
                <span className="count-pill">{activeCommitments.length}</span>
              </div>

              {activeCommitments.length === 0 ? (
                <p className="empty-state">No active commitments right now.</p>
              ) : (
                <div className="commitment-list">
                  {activeCommitments.map((commitment) => (
                    <CommitmentCard
                      commitment={commitment}
                      key={commitment.id}
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

            <section className="commitment-section">
              <div className="section-row">
                <div>
                  <p className="section-label">History</p>
                  <h3 className="subsection-title">Settled commitments</h3>
                </div>
                <span className="count-pill">{settledCommitments.length}</span>
              </div>

              {settledCommitments.length === 0 ? (
                <p className="empty-state">
                  Completed and failed-final commitments will appear here.
                </p>
              ) : (
                <div className="commitment-list">
                  {settledCommitments.map((commitment) => (
                    <CommitmentCard
                      commitment={commitment}
                      key={commitment.id}
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
          </div>
        )}
      </section>
    </main>
  );
}
