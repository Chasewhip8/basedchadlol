import { FC, useMemo, useState } from "react";
import { AsyncButton } from "../ui/button";
import useStore from "@/store/store";

const SwapButton: FC = () => {
    const inputTokenEntries = useStore((state) => state.inputTokens);

    const validInputTokenEntries = useMemo(
        () => inputTokenEntries.filter((entry) => entry.status == "ROUTING"),
        [inputTokenEntries],
    );

    const isDiabled = validInputTokenEntries.length == 0;

    return (
        <AsyncButton disabled={isDiabled} className="w-full">
            Swap
        </AsyncButton>
    );
};

export default SwapButton;
