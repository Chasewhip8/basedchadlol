import useStore from "@/store/store";
import { FC } from "react";
import SwapWarning from "./SwapWarning";

const SwapWarningsList: FC = () => {
    const [autoSlippage, maxSlippageBps] = useStore((state) => [
        state.autoSlippage,
        state.maxSlippageBps,
    ]);

    return [
        !autoSlippage &&
            maxSlippageBps > 150 &&
            "The slippage setting is currently set to a dangerous level, please double check and ensure this is intended. Swaps with high slippage are subject to MEV attacks.",
    ]
        .filter((w) => w)
        .map((m) => <SwapWarning key={m as string} message={m as string} />);
};

export default SwapWarningsList;
