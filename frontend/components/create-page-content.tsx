"use client";

import Link from "next/link";
import { useState } from "react";

import { CommitmentCreateForm } from "@/components/commitment-create-form";
import {
  buildDeadlineFromDateOnly,
  getFailReceiverValidationError,
  resolveEffectiveFailReceiver,
} from "@/lib/commitment-utils";
import { useTimeLendWalletActions } from "@/hooks/use-timelend-wallet-actions";
import { useWalletSession } from "@/hooks/use-wallet-session";
import { createCommitmentRecord } from "@/services/timelend-api";
import type { CreateCommitmentFormValues } from "@/types/frontend";

function formatShortAddress(address: string | undefined) {
  if (address === undefined) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * This component renders the focused create route while preserving the original create flow logic.
 * It receives no props because wallet state and submission state are managed locally through existing hooks.
 * It returns the creation page with wallet controls, the existing form, and supporting guidance.
 * It is important because the user now needs a dedicated create route without changing contract or API behavior.
 */
export function CreatePageContent() {
  const {
    address,
    isAuthenticated,
    isOnSupportedChain,
    session,
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

      <section className="panel page-header">
        <p className="section-label">Create commitment</p>
        <h1 className="page-title">Publish the escrow and goal.</h1>
        <p className="page-subtitle">
          Use the exact existing create flow to lock AVAX on-chain and register the matching
          backend record. The route is now cleaner and focused, but the submission behavior stays
          the same.
        </p>

        <div className="header-card-row">
          <div className="metric-card metric-card-primary">
            <span>Wallet address</span>
            <strong>{formatShortAddress(address)}</strong>
            <small>Connect and authenticate from Home before submitting.</small>
          </div>
          <div className="metric-card">
            <span>Route focus</span>
            <strong>Create only</strong>
            <small>The full create form has maximum space and a cleaner reading flow.</small>
          </div>
          <div className="metric-card">
            <span>Next step</span>
            <strong>Dashboard</strong>
            <small>After publishing, move to Dashboard for evidence and verification.</small>
          </div>
        </div>

        <div className="header-actions">
          <Link className="button button-secondary button-compact" href="/">
            Back home
          </Link>
          <Link className="button button-primary button-compact" href="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>

      {!isAuthenticated || !isOnSupportedChain ? (
        <section className="panel guard-panel">
          <p className="section-label">Wallet gate</p>
          <h2 className="section-title">Connect and authenticate on Home first</h2>
          <p className="muted-copy">
            This page keeps the same create logic, but the wallet controls now live on Home. Use
            your wallet there, then return here to submit.
          </p>
        </section>
      ) : null}

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
              <strong>Wallet authenticated on Home</strong>
              <p>Connect and sign from the Home page before attempting submission here.</p>
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
      </section>

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
    </main>
  );
}
