/**
 * This file creates the wagmi configuration used by the demo frontend wallet layer.
 * It exists to centralize chain, connector and transport setup in one audited place.
 * It fits the system by keeping MetaMask connectivity and contract writes consistent across the app.
 */
import { http, type Transport } from "viem";
import { avalancheFuji } from "wagmi/chains";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";

import { getFrontendRuntimeConfig } from "./env";

const runtimeConfig = getFrontendRuntimeConfig();

/**
 * This constant stores the shared wagmi config for the demo application.
 * It receives its dynamic values from the validated frontend environment.
 * It returns the config object consumed by WagmiProvider.
 * It is important because wallet connection and contract interaction must all target the same chain and RPC transport.
 */
export const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  connectors: [injected()],
  ssr: true,
  transports: {
    [avalancheFuji.id]: http(runtimeConfig.NEXT_PUBLIC_RPC_URL) as Transport
  }
});
