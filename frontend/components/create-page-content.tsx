"use client";

import Link from "next/link";
import { useState } from "react";

import { CommitmentCreateForm } from "@/components/commitment-create-form";
import { WalletSessionPanel } from "@/components/wallet-session-panel";
import {
  buildDeadlineFromDateOnly,
  getFailReceiverValidationError,
  resolveEffectiveFailReceiver,
} from "@/lib/commitment-utils";
import { useTimeLendWalletActions } from "@/hooks/use-timelend-wallet-actions";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { createCommitmentRecord } from "@/services/timelend-api";
import type { CreateCommitmentFormValues } from "@/types/frontend";

/**
 * This component renders the focused create route while preserving the original create flow logic.
 * It receives no props because wallet state and submission state are managed locally through existing hooks.
 * It returns the creation page with wallet controls, the existing form, and supporting guidance.
 * It is important because the user now needs a dedicated create route without changing contract or API behavior.
 */
export function CreatePageContent() {
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
  const { createCommitmentWithWallet, walletReady } = useTimeLendWalletActions();
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * This function creates the commitment on-chain and then persists its metadata in the backend.
   * It receives the controlled create-form values.
   * It returns a promise that resolves after the chain transaction and backend sync finish.
   * It is important because the create page must preserve the existing production-like submission flow.
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the commitment.";
      setCreateError(message);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="demo-shell page-shell">
      <div className="demo-orb demo-orb-primary" aria-hidden="true" />

      <section className="hero-strip page-hero page-hero-compact">
        <div className="hero-main">
          <p className="section-label">Create commitment</p>
          <h1>Publish the escrow and goal.</h1>
          <p className="hero-copy">
            Use the exact existing create flow to lock AVAX on-chain and register the matching
            backend record. This route simply gives that action its own clear workspace.
          </p>
        </div>

        <aside className="hero-aside">
          <div className="hero-card-grid">
            <div className="metric-card metric-card-primary">
              <span>Route focus</span>
              <strong>Create only</strong>
              <small>Wallet connection and submission stay visible without dashboard clutter.</small>
            </div>
            <div className="metric-card">
              <span>Next step</span>
              <strong>Dashboard</strong>
              <small>Track evidence, verification, appeals, and settlement after creation.</small>
            </div>
          </div>

          <div className="hero-actions hero-actions-stack">
            <Link className="button button-secondary" href="/">
              Back home
            </Link>
            <Link className="button button-primary" href="/dashboard">
              Open dashboard
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

      <div className="focus-layout">
        <div className="focus-main">
          <CommitmentCreateForm
            canSubmit={isAuthenticated && isOnSupportedChain && walletReady}
            isSubmitting={isCreating}
            onSubmit={handleCreateCommitment}
            userWalletAddress={address}
          />

          <div className="notice-stack" aria-live="polite">
            {createError !== null ? <p className="feedback feedback-error">{createError}</p> : null}
            {pageMessage !== null ? <p className="feedback feedback-success">{pageMessage}</p> : null}
          </div>
        </div>

        <aside className="focus-side">
          <section className="panel info-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Before you submit</p>
                <h2 className="section-title">Keep the same flow, just cleaner</h2>
              </div>
            </div>

            <div className="timeline-list">
              <div className="timeline-item">
                <span className="timeline-step">01</span>
                <div>
                  <strong>Wallet connected</strong>
                  <p>Use the panel above to connect and authenticate before attempting submission.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">02</span>
                <div>
                  <strong>Fuji selected</strong>
                  <p>The contract call still requires Avalanche Fuji exactly as before.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">03</span>
                <div>
                  <strong>Dashboard after create</strong>
                  <p>Once published, move to Dashboard to upload evidence and drive verification.</p>
                </div>
              </div>
            </div>

            {!isAuthenticated ? (
              <div className="empty-state-card compact-card">
                <p className="empty-state-title">Wallet authentication required</p>
                <p className="empty-state">
                  The create form keeps the same submission behavior. Authenticate above to unlock
                  the final button state.
                </p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}
