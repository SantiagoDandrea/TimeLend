/**
 * This file renders the main app shell with navigation and layout.
 * It provides the authenticated user experience after wallet connection.
 * It fits the system by being the main container for dashboard and create views.
 */
"use client";

import { useState } from "react";
import { Clock, Copy, ExternalLink, LayoutDashboard, LogOut, Plus, Check, ChevronDown } from "lucide-react";

import { useWalletSession } from "@/hooks/use-wallet-session";
import { Dashboard } from "@/components/dashboard";
import { CreateCommitmentFlow } from "@/components/create-commitment-flow";

type AppShellProps = {
  onDisconnect: () => void;
};

type View = "dashboard" | "create";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * This component renders the main app shell with navigation.
 * It receives a callback for disconnecting the wallet.
 * It returns the full authenticated app UI.
 * It is important because it's the main container for all authenticated views.
 */
export function AppShell({ onDisconnect }: AppShellProps) {
  const { address, chainId, connectorName, disconnectWallet, isOnSupportedChain } =
    useWalletSession();

  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleDisconnect() {
    disconnectWallet();
    onDisconnect();
  }

  async function copyAddress() {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentView("dashboard")}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">TimeLend</span>
              </button>

              {/* Navigation */}
              <nav className="hidden items-center gap-1 md:flex">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === "dashboard"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView("create")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentView === "create"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  Create
                </button>
              </nav>
            </div>

            {/* Right Side - Wallet Profile */}
            <div className="flex items-center gap-4">
              {/* Chain Indicator */}
              <div
                className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:flex ${
                  isOnSupportedChain
                    ? "bg-[var(--tl-success-muted)] text-[var(--tl-success)]"
                    : "bg-[var(--tl-warning-muted)] text-[var(--tl-warning)]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnSupportedChain ? "bg-[var(--tl-success)]" : "bg-[var(--tl-warning)]"
                  }`}
                />
                {isOnSupportedChain ? "Fuji" : "Wrong Network"}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {/* Avatar */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-xs font-bold text-white">
                    {address?.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{address ? shortenAddress(address) : "Connected"}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card p-2 shadow-lg">
                      {/* Wallet Info */}
                      <div className="mb-2 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Connected Wallet</p>
                        <p className="mt-1 truncate font-mono text-sm text-foreground">
                          {address}
                        </p>
                        {connectorName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            via {connectorName}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => {
                          void copyAddress();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-[var(--tl-success)]" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy Address"}
                      </button>

                      {address && (
                        <a
                          href={`https://testnet.snowtrace.io/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View on Explorer
                        </a>
                      )}

                      <div className="my-2 border-t border-border" />

                      <button
                        onClick={handleDisconnect}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--tl-danger)] transition-colors hover:bg-[var(--tl-danger-muted)]"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-7xl px-4">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                currentView === "dashboard"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("create")}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                currentView === "create"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {currentView === "dashboard" && (
          <Dashboard onCreateNew={() => setCurrentView("create")} />
        )}
        {currentView === "create" && (
          <CreateCommitmentFlow
            onComplete={() => setCurrentView("dashboard")}
            onCancel={() => setCurrentView("dashboard")}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <Clock className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">TimeLend</span>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Built on Avalanche
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
