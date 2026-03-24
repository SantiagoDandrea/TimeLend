/**
 * This file orchestrates the main TimeLend application flow.
 * It handles the wallet-gated authentication and view switching.
 * It fits the system by being the top-level coordinator for the entire app.
 */
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useWalletSession } from "@/hooks/use-wallet-session";
import { LandingPage } from "@/components/landing-page";
import { AppShell } from "@/components/app-shell";

/**
 * This component orchestrates the entire TimeLend application.
 * It receives no props as it manages all state internally via hooks.
 * It returns either the landing page or the authenticated app shell.
 * It is important because it handles the wallet-gated authentication flow.
 */
export function TimeLendApp() {
  const { isConnected, isAuthenticated, isConnecting, isAuthenticating } = useWalletSession();
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration to prevent mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Auto-enter app if already authenticated
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      setHasEnteredApp(true);
    }
  }, [isConnected, isAuthenticated]);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading during connection/authentication
  if (isConnecting || isAuthenticating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <Loader2 className="relative h-12 w-12 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground">
          {isConnecting ? "Connecting wallet..." : "Authenticating..."}
        </p>
      </div>
    );
  }

  // Show landing page if not authenticated or hasn't entered app
  if (!isConnected || !isAuthenticated || !hasEnteredApp) {
    return <LandingPage onEnterApp={() => setHasEnteredApp(true)} />;
  }

  // Show main app
  return <AppShell onDisconnect={() => setHasEnteredApp(false)} />;
}
