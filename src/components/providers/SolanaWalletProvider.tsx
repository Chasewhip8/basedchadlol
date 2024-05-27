import React, { FC, PropsWithChildren, useMemo } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

const SolanaWalletProvider: FC<PropsWithChildren> = ({ children }) => {
    const wallets = useMemo(() => [], []);
    return (
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
    );
};

export default SolanaWalletProvider;
