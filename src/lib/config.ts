import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export const CLUSTER_URL = clusterApiUrl(WalletAdapterNetwork.Mainnet);
