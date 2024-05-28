import { FC } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    InputTokenEntry,
    RoutingStatus,
    isRoutingStatusError,
} from "@/store/store";
import { cn } from "@/lib/utils";

interface SwapStatusProps {
    entry: InputTokenEntry;
}

function getHumanReadableError(status: RoutingStatus) {
    switch (status) {
        case "AMOUNT_TOO_SMALL":
            return "swap amount too small";
        case "JUPITER_UNKOWN":
            return "an unkown Jupiter V6 API error";
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

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className="px-1 h-full">
                    <div
                        className={cn(
                            "w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0",
                            !hasRoute && "bg-gray-400",
                            hasError && "bg-yellow-400",
                        )}
                    />
                </TooltipTrigger>
                <TooltipContent
                    sideOffset={-7}
                    className="flex flex-col gap-y-1"
                >
                    {hasRoute && (
                        <p>
                            This route is being included in the swap. The swap
                            will be executed if it{"'"}s transaction is
                            confirmed.
                        </p>
                    )}

                    {hasError && (
                        <p className="font-semibold">
                            Swap excluded because{" "}
                            {getHumanReadableError(status)}
                        </p>
                    )}

                    {!hasRoute && !hasError && (
                        <p>
                            Enter an amount to include this entry in the swap.
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default SwapStatusIndicator;
