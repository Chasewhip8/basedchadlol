import React, { FC, PropsWithChildren, useEffect, useMemo } from "react";
import { WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import useStore from "@/store/store";

const SolanaWalletProvider: FC<PropsWithChildren> = ({ children }) => {
    const wallets = useMemo(() => [], []);
    return (
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <WalletStateKeeper>{children}</WalletStateKeeper>
            </WalletModalProvider>
        </WalletProvider>
    );
};

const WalletStateKeeper: FC<PropsWithChildren> = ({ children }) => {
    const wallet = useWallet();
    const setWallet = useStore((state) => state.setWallet);

    useEffect(() => setWallet(wallet), [wallet, setWallet]);

    return children;
};

export default SolanaWalletProvider;
