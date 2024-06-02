import { FC } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import useStore, {
    InputTokenEntry,
    RoutingStatus,
    isRoutingStatusError,
} from "@/store/store";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

interface SwapStatusProps {
    entry: InputTokenEntry;
}

function getHumanReadableError(status: RoutingStatus) {
    switch (status) {
        case "AMOUNT_TOO_SMALL":
            return "the swap amount is oo small";
        case "JUPITER_UNKOWN":
            return "an unkown Jupiter V6 API error occured. Likely no route was found";
        case "NO_ROUTE":
            return "no route was found for the swap";
        case "SAME_INPUT_OUTPUT":
            return "the input and output tokens are the same";
    }
}

const SwapStatusIndicator: FC<SwapStatusProps> = ({ entry }) => {
    const { status } = entry;
    const hasRoute = Boolean(entry.route?.jupiterQuote);
    const hasError = isRoutingStatusError(status);

    const [autoSlippage, maxAutoSlippageBps, maxSlippageBps] = useStore(
        (state) => [
            state.autoSlippage,
            state.maxAutoSlippageBps,
            state.maxSlippageBps,
        ],
    );
    const jupiterQuote = entry.route?.jupiterQuote;
    const priceImpact =
        jupiterQuote?.priceImpactPct &&
        parseFloat(jupiterQuote?.priceImpactPct);
    const priceImpactSlippageWarning =
        hasRoute &&
        priceImpact &&
        priceImpact >
            (autoSlippage ? maxAutoSlippageBps / 100 : maxSlippageBps / 100);

    const swapDisplayError = !hasRoute && hasError;
    const swapDisplayWarning = hasRoute && hasError;

    return (
        <Popover>
            <PopoverTrigger asChild>
                {!(swapDisplayWarning || priceImpactSlippageWarning) ? (
                    <button
                        className={cn(
                            "w-3 h-3 ml-2 rounded-full bg-green-400 flex-shrink-0",
                            !hasRoute && "bg-gray-400",
                            (swapDisplayWarning ||
                                priceImpactSlippageWarning) &&
                                "bg-yellow-400",
                            swapDisplayError && "bg-red-400",
                        )}
                    />
                ) : (
                    <InfoIcon className="w-3 h-3 ml-2 text-yellow-400 flex-shrink-0 cursor-pointer" />
                )}
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-y-1 font-semibold">
                {(swapDisplayError && (
                    <p>
                        Swap excluded because {getHumanReadableError(status)}.
                    </p>
                )) ||
                    (swapDisplayWarning && (
                        <p>
                            Swap included however{" "}
                            {getHumanReadableError(status)}.
                        </p>
                    )) ||
                    (priceImpactSlippageWarning && (
                        <p>
                            Swap included however the price impact of{" "}
                            {priceImpact.toFixed(2)}% is greater than the
                            slippage tolerance.
                        </p>
                    )) ||
                    (hasRoute && (
                        <p>
                            This route is being included in the swap. The swap
                            will be executed if it{"'"}s transaction is
                            confirmed.
                        </p>
                    )) || (
                        <p>
                            Enter an amount to include this entry in the swap.
                        </p>
                    )}
            </PopoverContent>
        </Popover>
    );
};

export default SwapStatusIndicator;
