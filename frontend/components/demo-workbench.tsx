/**
 * This file renders the full functional demo workbench for TimeLend.
 * It exists to replace the placeholder landing page with an end-to-end testing UI.
 * It fits the system by exposing wallet auth, contract creation and backend flows in one place.
 */
"use client";

import { useState } from "react";
import { formatEther } from "viem";

import { CommitmentCard } from "@/components/commitment-card";
import { CommitmentCreateForm } from "@/components/commitment-create-form";
import { WalletSessionPanel } from "@/components/wallet-session-panel";
import {
  buildDeadlineFromDateOnly,
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

/**
 * This component renders the single-page demo workbench used to test the full system.
 * It receives no props because all state comes from hooks and runtime config.
 * It returns the main functional frontend UI.
 * It is important because the project now needs a practical operator-facing demo instead of a placeholder landing page.
 */
export function DemoWorkbench() {
  const runtimeConfig = getFrontendRuntimeConfig();
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
  const { appealCommitmentWithWallet, createCommitmentWithWallet, walletReady } =
    useTimeLendWalletActions();
  const { commitments, dashboardError, initialLoadComplete, isRefreshing, refreshCommitments } =
    useCommitmentsDashboard(session, isAuthenticated ? address : undefined);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
   * This function creates the commitment on-chain and then persists its metadata in the backend.
   * It receives the controlled create-form values.
   * It returns a promise that resolves after both the chain transaction and backend sync finish.
   * It is important because the demo must test the real split responsibility between contract and backend.
   */
  async function handleCreateCommitment(values: CreateCommitmentFormValues) {
    if (!isAuthenticated || session === null || address === undefined) {
      throw new Error("Connect and authenticate a wallet before creating commitments.");
    }

    if (!isOnSupportedChain) {
      throw new Error("Switch the wallet to Avalanche Fuji before creating commitments.");
    }

    if (!walletReady) {
      throw new Error("Wallet client is still initializing.");
    }

    setIsCreating(true);
    setCreateError(null);
    setPageMessage(null);

    try {
      const failReceiverError = getFailReceiverValidationError({
        failReceiver: values.failReceiver,
        useWebOwnerWallet: values.useWebOwnerWallet,
        walletAddress: address,
      });

      if (failReceiverError !== null) {
        throw new Error(failReceiverError);
      }

      const effectiveFailReceiver = resolveEffectiveFailReceiver({
        failReceiver: values.failReceiver,
        useWebOwnerWallet: values.useWebOwnerWallet,
      });
      const deadline = buildDeadlineFromDateOnly(values.deadlineDate);
      const onChainCommitment = await createCommitmentWithWallet({
        amountAvax: values.amountAvax,
        deadlineUnix: deadline.unix,
        failReceiver: effectiveFailReceiver,
        walletAddress: address,
      });

      await createCommitmentRecord(session.token, {
        amount: onChainCommitment.amountWei,
        createCommitmentTxHash: onChainCommitment.txHash,
        deadline: deadline.iso,
        description: values.description.trim(),
        failReceiver: effectiveFailReceiver,
        onchainId: onChainCommitment.onchainId,
        title: values.title.trim(),
      });

      setPageMessage(
        `Commitment created successfully. On-chain id: ${onChainCommitment.onchainId}. Fail receiver: ${effectiveFailReceiver}.`,
      );
      await refreshCommitments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the commitment.";
      setCreateError(message);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }

  /**
   * This function uploads one evidence file for the selected commitment and refreshes the dashboard.
   * It receives the off-chain commitment id and the browser file selected by the user.
   * It returns a promise that resolves after the backend stores and parses the evidence.
   * It is important because evidence ingestion is the entry point to AI verification.
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
   * It returns a promise that resolves after the queue request is accepted.
   * It is important because verification moves the commitment into completed or failed-pending-appeal asynchronously.
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
   * It receives the hydrated commitment aggregate selected for appeal.
   * It returns a promise that resolves after both the chain and backend steps finish.
   * It is important because the current backend only accepts appeals that were first registered on-chain by the user.
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
   * This function triggers the internal demo appeal-resolution proxy and refreshes the dashboard.
   * It receives the off-chain commitment id.
   * It returns a promise that resolves after the internal route accepts the request.
   * It is important because demo users need a simple way to exercise the internal resolution path.
   */
  async function handleResolveAppeal(commitmentId: string) {
    const commitment = await resolveAppealDemo(commitmentId);
    setPageMessage(
      `Appeal resolved. Commitment ${commitment.onchainId} is now ${commitment.status}.`,
    );
    await refreshCommitments();
  }

  /**
   * This function triggers the internal demo finalization proxy for unappealed failed commitments.
   * It receives the off-chain commitment id.
   * It returns a promise that resolves after the backend finalizes or rejects the action.
   * It is important because the demo should expose the full failure settlement flow as well.
   */
  async function handleFinalize(commitmentId: string) {
    await finalizeFailedDemo(commitmentId);
    setPageMessage("Failed commitment finalization requested.");
    await refreshCommitments();
  }

  return (
    <main className="demo-shell">
      <div className="demo-orb demo-orb-primary" aria-hidden="true" />
      <div className="demo-orb demo-orb-secondary" aria-hidden="true" />

      <header className="demo-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">TL</div>
          <div>
            <p className="brand-name">TimeLend</p>
            <p className="brand-tagline">AI-verified commitments for Avalanche Fuji.</p>
          </div>
        </div>

        <div className="topbar-pills" aria-label="Protocol status">
          <span className="topbar-pill">Avalanche Fuji</span>
          <span className="topbar-pill">AI verification</span>
          <span className="topbar-pill">Demo ready</span>
        </div>
      </header>

      <section className="hero-strip">
        <div className="hero-main">
          <p className="section-label">TimeLend Protocol</p>
          <h1>Commit. Stake. Prove.</h1>
          <p className="hero-copy">
            TimeLend turns personal goals into verifiable on-chain commitments. Lock AVAX, submit
            real evidence, let AI evaluate the outcome, and settle the result transparently.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#wallet-panel">
              Connect wallet
            </a>
            <a className="button button-secondary" href="#create-panel">
              Create commitment
            </a>
          </div>

          <div className="hero-feature-list" aria-label="Product highlights">
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              On-chain escrow with Avalanche Fuji settlement
            </div>
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              Evidence upload, parsing, and AI verification
            </div>
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              Appeal and finalization flow ready for live demo
            </div>
          </div>
        </div>

        <aside className="hero-aside">
          <div className="hero-card-grid">
            <div className="metric-card metric-card-primary">
              <span>Portfolio overview</span>
              <strong>{commitments.length}</strong>
              <small>Total commitments tracked in this session</small>
            </div>

            <div className="metric-card">
              <span>Active flow</span>
              <strong>{activeCommitments.length}</strong>
              <small>Live, pending, or appeal-stage commitments</small>
            </div>

            <div className="metric-card">
              <span>Total staked</span>
              <strong>{formatEther(totalStakedWei)} AVAX</strong>
              <small>Escrow value represented across this dashboard</small>
            </div>

            <div className="metric-card">
              <span>Processing</span>
              <strong>{processingCount}</strong>
              <small>Commitments currently moving through automation</small>
            </div>
          </div>

          <div className="hero-note">
            <p className="eyebrow">Live contract</p>
            <p className="hero-note-value">{runtimeConfig.NEXT_PUBLIC_CONTRACT_ADDRESS}</p>
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

      <div className="workspace-grid">
        <div className="workspace-column">
          <CommitmentCreateForm
            canSubmit={isAuthenticated && isOnSupportedChain && walletReady}
            isSubmitting={isCreating}
            onSubmit={handleCreateCommitment}
            userWalletAddress={address}
          />

          <section className="panel info-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Flow</p>
                <h2 className="section-title">How TimeLend settles outcomes</h2>
              </div>
            </div>

            <div className="timeline-list">
              <div className="timeline-item">
                <span className="timeline-step">01</span>
                <div>
                  <strong>Stake and publish commitment</strong>
                  <p>Lock AVAX on Avalanche Fuji and register the goal in the backend.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">02</span>
                <div>
                  <strong>Upload evidence</strong>
                  <p>Provide files, written proof, or both to support the verification pass.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">03</span>
                <div>
                  <strong>AI evaluates and settlement follows</strong>
                  <p>
                    Success closes the loop cleanly. Failure can trigger appeal or immediate final
                    payout depending on the decision.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="workspace-column workspace-column-wide">
          <div className="notice-stack" aria-live="polite">
            {createError !== null ? <p className="feedback feedback-error">{createError}</p> : null}
            {pageMessage !== null ? <p className="feedback feedback-success">{pageMessage}</p> : null}
            {dashboardError !== null ? (
              <p className="feedback feedback-error">{dashboardError}</p>
            ) : null}
          </div>

          <section className="panel dashboard-panel" id="dashboard-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Dashboard</p>
                <h2 className="section-title">Your commitments</h2>
                <p className="muted-copy">
                  Monitor active positions, review AI decisions, and settle the full demo flow from
                  one place.
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
                <span>Active</span>
                <strong>{activeCommitments.length}</strong>
              </div>
              <div className="summary-pill">
                <span>Settled</span>
                <strong>{settledCommitments.length}</strong>
              </div>
              <div className="summary-pill">
                <span>Connected wallet</span>
                <strong>{address ?? "Not connected"}</strong>
              </div>
            </div>

            {!initialLoadComplete ? (
              <p className="empty-state">Loading dashboard...</p>
            ) : !isAuthenticated ? (
              <div className="empty-state-card">
                <p className="empty-state-title">Wallet authentication required</p>
                <p className="empty-state">
                  Connect a wallet and sign the session message to load your commitments.
                </p>
              </div>
            ) : commitments.length === 0 ? (
              <div className="empty-state-card">
                <p className="empty-state-title">No commitments yet</p>
                <p className="empty-state">
                  Create your first TimeLend commitment to see live statuses, evidence entries, and
                  verification outcomes here.
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
                    <p className="empty-state">Completed and failed-final commitments will appear here.</p>
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
        </div>
      </div>

      <footer className="demo-footer">
        <div>
          <p className="section-label">TimeLend</p>
          <p className="footer-copy">
            Production-shaped demo for wallet auth, escrow commitments, AI verification, appeal,
            and settlement on Avalanche Fuji.
          </p>
        </div>

        <div className="footer-links" aria-label="Community links">
          <a href="https://x.com" rel="noreferrer" target="_blank">
            X
          </a>
          <a href="https://github.com" rel="noreferrer" target="_blank">
            GitHub
          </a>
          <a href="https://discord.com" rel="noreferrer" target="_blank">
            Discord
          </a>
        </div>
      </footer>
    </main>
  );
}
