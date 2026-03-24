/**
 * This file renders the wallet connection and authentication controls for the demo frontend.
 * It exists to keep wallet UX separated from the commitment dashboard itself.
 * It fits the system by making connection, chain state and auth state visible at a glance.
 */
type WalletSessionPanelProps = {
  address: string | undefined;
  connectorName: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isOnSupportedChain: boolean;
  onAuthenticate: () => Promise<void>;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  onSwitchChain: () => Promise<void>;
  sessionError: string | null;
};

/**
 * This component renders the demo wallet and auth status panel.
 * It receives connection state and the actions required to connect, authenticate, switch chain and disconnect.
 * It returns the top control panel shown above the commitment flow.
 * It is important because users need a clear view of wallet, chain and backend-session state before testing flows.
 */
export function WalletSessionPanel({
  address,
  connectorName,
  isAuthenticated,
  isAuthenticating,
  isConnected,
  isConnecting,
  isOnSupportedChain,
  onAuthenticate,
  onConnect,
  onDisconnect,
  onSwitchChain,
  sessionError
}: WalletSessionPanelProps) {
  return (
    <section className="panel wallet-panel" id="wallet-panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Wallet</p>
          <h2 className="section-title">Connection and session control</h2>
          <p className="muted-copy">
            Connect, authenticate, and confirm that your wallet is ready to interact with the live
            demo flow.
          </p>
        </div>
      </div>

      <div className="panel-grid">
        <div className="stat-box stat-box-highlight">
          <span>Connection</span>
          <strong>{isConnected ? "Connected" : "Not connected"}</strong>
          <small>{connectorName ?? "No connector selected"}</small>
        </div>

        <div className="stat-box">
          <span>Wallet</span>
          <strong>{address ?? "Connect a wallet to start"}</strong>
          <small>{isOnSupportedChain ? "Avalanche Fuji ready" : "Switch to Avalanche Fuji"}</small>
        </div>

        <div className="stat-box">
          <span>Backend session</span>
          <strong>{isAuthenticated ? "Authenticated" : "Pending authentication"}</strong>
          <small>JWT session used for protected backend endpoints</small>
        </div>
      </div>

      <div className="button-row wallet-actions">
        {!isConnected ? (
          <button
            className="button button-primary"
            disabled={isConnecting}
            onClick={() => void onConnect()}
            type="button"
          >
            {isConnecting ? "Connecting..." : "Connect wallet"}
          </button>
        ) : (
          <>
            {!isOnSupportedChain ? (
              <button
                className="button button-warning"
                onClick={() => void onSwitchChain()}
                type="button"
              >
                Switch to Fuji
              </button>
            ) : null}

            {!isAuthenticated ? (
              <button
                className="button button-primary"
                disabled={isAuthenticating}
                onClick={() => void onAuthenticate()}
                type="button"
              >
                {isAuthenticating ? "Signing..." : "Authenticate with wallet"}
              </button>
            ) : null}

            <button className="button button-secondary" onClick={onDisconnect} type="button">
              Disconnect
            </button>
          </>
        )}
      </div>

      <div className="wallet-meta-row">
        <div className="wallet-meta-card">
          <span>Network</span>
          <strong>{isOnSupportedChain ? "Avalanche Fuji" : "Unsupported chain"}</strong>
        </div>
        <div className="wallet-meta-card">
          <span>Wallet address</span>
          <strong>{address ?? "Waiting for connection"}</strong>
        </div>
      </div>

      {sessionError !== null ? <p className="feedback feedback-error">{sessionError}</p> : null}
    </section>
  );
}
