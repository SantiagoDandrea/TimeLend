/**
 * This file renders the landing/marketing page for TimeLend.
 * It exists to serve as the entry point before wallet connection.
 * It fits the system by being the first thing users see before accessing the app.
 */
"use client";

import { ArrowRight, CheckCircle2, Clock, Shield, Wallet, Zap } from "lucide-react";

import { useWalletSession } from "@/hooks/use-wallet-session";

type LandingPageProps = {
  onEnterApp: () => void;
};

/**
 * This component renders the marketing landing page with connect wallet CTA.
 * It receives a callback to trigger when entering the app.
 * It returns the full landing page UI.
 * It is important because it's the first impression and wallet gate for the app.
 */
export function LandingPage({ onEnterApp }: LandingPageProps) {
  const {
    connectWallet,
    isConnecting,
    isConnected,
    isAuthenticated,
    authenticateWallet,
    isAuthenticating,
  } = useWalletSession();

  async function handleConnect() {
    try {
      if (!isConnected) {
        await connectWallet();
      }
      if (!isAuthenticated) {
        await authenticateWallet();
      }
      onEnterApp();
    } catch (error) {
      console.log("[v0] Connection error:", error);
    }
  }

  const isLoading = isConnecting || isAuthenticating;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">TimeLend</span>
            </div>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#how-it-works"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                How it Works
              </a>
              <a
                href="#features"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
            </nav>

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wallet className="h-4 w-4" />
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Background gradient effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-muted-foreground">Powered by Avalanche</span>
            </div>

            {/* Main headline */}
            <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <span className="gradient-text">Commit.</span>{" "}
              <span className="text-foreground">Stake.</span>{" "}
              <span className="gradient-text">Prove.</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              Put your money where your goals are. Stake AVAX on your commitments and let AI verify
              your success. Win by following through, or lose your stake.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="glow-primary group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Wallet className="h-5 w-5" />
                {isLoading ? "Connecting..." : "Connect Wallet"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href="#how-it-works"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/50 px-8 py-4 text-lg font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-card sm:w-auto"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="mt-1 text-sm text-muted-foreground">On-chain Verification</div>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-foreground">AI-Powered</div>
                <div className="mt-1 text-sm text-muted-foreground">Evidence Analysis</div>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-foreground">Trustless</div>
                <div className="mt-1 text-sm text-muted-foreground">Smart Contracts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Three simple steps to turn your goals into commitments with real stakes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="glass-card group relative rounded-2xl p-8 transition-all hover:glow-primary">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </div>
              <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Make a Commitment</h3>
              <p className="text-muted-foreground">
                Define your goal with a clear, verifiable outcome. Whether it's finishing a project,
                exercising, or learning something new.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card group relative rounded-2xl p-8 transition-all hover:glow-primary">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </div>
              <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Stake AVAX</h3>
              <p className="text-muted-foreground">
                Put your money where your mouth is. The staked amount stays locked in a smart
                contract until the deadline.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card group relative rounded-2xl p-8 transition-all hover:glow-primary">
              <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                3
              </div>
              <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Submit Proof</h3>
              <p className="text-muted-foreground">
                Upload evidence of completion. Our AI verifies your proof and releases your funds if
                successful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Why TimeLend?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Built for the modern age with Web3 technology at its core
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="glass-card rounded-2xl p-6">
              <Shield className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Trustless Security</h3>
              <p className="text-sm text-muted-foreground">
                Smart contracts ensure your funds are handled fairly with no middleman.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Zap className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">AI Verification</h3>
              <p className="text-sm text-muted-foreground">
                Advanced AI analyzes your proof to determine if you've met your commitment.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Clock className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Flexible Deadlines</h3>
              <p className="text-sm text-muted-foreground">
                Set your own timeline. Short-term sprints or long-term goals.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <CheckCircle2 className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Appeal System</h3>
              <p className="text-sm text-muted-foreground">
                Disagree with the verdict? Submit an appeal for human review.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <Wallet className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Low Fees</h3>
              <p className="text-sm text-muted-foreground">
                Built on Avalanche for fast, affordable transactions.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <ArrowRight className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">Instant Settlement</h3>
              <p className="text-sm text-muted-foreground">
                Funds are released immediately upon successful verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="glass-card glow-primary-strong relative overflow-hidden rounded-3xl p-12 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/30 blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                Ready to Commit?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                Connect your wallet and start turning your goals into achievements. Your future self
                will thank you.
              </p>

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Wallet className="h-5 w-5" />
                {isLoading ? "Connecting..." : "Get Started"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">TimeLend</span>
            </div>

            <div className="flex items-center gap-6">
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
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              Built on Avalanche
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
