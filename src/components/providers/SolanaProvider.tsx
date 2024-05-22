import React, { FC, PropsWithChildren, useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CLUSTER_URL } from "@/lib/config";

const SolanaProvider: FC<PropsWithChildren> = ({ children }) => {
    const wallets = useMemo(() => [], []);
    return (
        <ConnectionProvider endpoint={CLUSTER_URL}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaProvider;
