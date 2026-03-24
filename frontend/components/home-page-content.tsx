"use client";

import Link from "next/link";

import { WalletSessionPanel } from "@/components/wallet-session-panel";
import { getFrontendRuntimeConfig } from "@/lib/env";
import { useWalletSession } from "@/hooks/use-wallet-session";

/**
 * This component renders the focused landing page for the TimeLend demo.
 * It receives no props because wallet state is loaded from the shared session hook.
 * It returns the home experience with hero copy, CTAs, and wallet entry.
 * It is important because the root route now acts as a clean entry point instead of a mixed workbench.
 */
export function HomePageContent() {
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
    sessionError,
    switchToSupportedChain,
  } = useWalletSession();

  return (
    <main className="demo-shell page-shell">
      <div className="demo-orb demo-orb-primary" aria-hidden="true" />
      <div className="demo-orb demo-orb-secondary" aria-hidden="true" />

      <section className="hero-strip page-hero">
        <div className="hero-main">
          <p className="section-label">TimeLend Protocol</p>
          <h1>Commit. Stake. Prove.</h1>
          <p className="hero-copy">
            Turn personal goals into on-chain commitments. Stake AVAX, prove what you did, and let
            AI verification settle the outcome with transparent backend and contract coordination.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" href="/create">
              Create Commitment
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Dashboard
            </Link>
          </div>

          <div className="hero-feature-list" aria-label="Product highlights">
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              Escrow-first commitment creation on Avalanche Fuji
            </div>
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              Evidence upload, parsing, and AI-backed verification
            </div>
            <div className="hero-feature">
              <span className="hero-feature-dot" />
              Appeal and final settlement flows for live demos
            </div>
          </div>
        </div>

        <aside className="hero-aside">
          <div className="hero-card-grid">
            <div className="metric-card metric-card-primary">
              <span>Wallet status</span>
              <strong>{isConnected ? "Connected" : "Ready to connect"}</strong>
              <small>{isAuthenticated ? "Backend session active" : "Authenticate after connecting"}</small>
            </div>
            <div className="metric-card">
              <span>Target network</span>
              <strong>{isOnSupportedChain ? "Avalanche Fuji" : "Fuji required"}</strong>
              <small>Contract creation and appeals run on Avalanche Fuji.</small>
            </div>
            <div className="metric-card">
              <span>Contract</span>
              <strong>Live demo</strong>
              <small>{runtimeConfig.NEXT_PUBLIC_CONTRACT_ADDRESS}</small>
            </div>
            <div className="metric-card">
              <span>Flow</span>
              <strong>3 focused routes</strong>
              <small>Home for entry, Create for escrow, Dashboard for evidence and settlement.</small>
            </div>
          </div>
        </aside>
      </section>

      <div className="page-grid">
        <div className="page-column page-column-wide">
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
        </div>

        <div className="page-column">
          <section className="panel info-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">How it works</p>
                <h2 className="section-title">A cleaner entry for the full demo</h2>
                <p className="muted-copy">
                  Start here, authenticate your wallet, then move into focused routes for creating
                  commitments or operating the dashboard.
                </p>
              </div>
            </div>

            <div className="timeline-list">
              <div className="timeline-item">
                <span className="timeline-step">01</span>
                <div>
                  <strong>Connect and authenticate</strong>
                  <p>Use your wallet to establish the backend session required for protected flows.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">02</span>
                <div>
                  <strong>Create commitment</strong>
                  <p>Move to the Create page to lock AVAX and publish the commitment metadata.</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-step">03</span>
                <div>
                  <strong>Operate from Dashboard</strong>
                  <p>Upload evidence, trigger verification, and follow appeal or final settlement.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
