import { FC, useMemo, useState } from "react";
import { AsyncButton, Button } from "../ui/button";
import useStore from "@/store/store";
import { useWallet } from "@solana/wallet-adapter-react";

const SwapButton: FC = () => {
    const [inputTokenEntries, swapAllRoutes] = useStore((state) => [
        state.inputTokens,
        state.swapAllRoutes,
    ]);

    const validInputTokenEntries = useMemo(
        () => inputTokenEntries.filter((entry) => entry.status == "ROUTING"),
        [inputTokenEntries],
    );

    const wallet = useWallet();

    const isDiabled = validInputTokenEntries.length == 0 || !wallet?.publicKey;

    return (
        <Button
            onClick={() =>
                wallet.publicKey && swapAllRoutes(wallet.publicKey.toBase58())
            }
            disabled={isDiabled}
            className="w-full"
        >
            Swap
        </Button>
    );
};

export default SwapButton;
