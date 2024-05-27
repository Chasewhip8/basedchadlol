import { FC } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { InputTokenEntry, SwapErrors } from "@/store/store";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

interface SwapStatusProps {
    entry: InputTokenEntry;
}

function getHumanReadableError(error: SwapErrors) {
    switch (error) {
        case "AMOUNT_TOO_SMALL":
            return "Swap amount too small";
        case "JUPITER_UNKOWN":
            return "An unkown Jupiter V6 API error";
        case "NO_ROUTE":
            return "No route found for the swap";
        case "SAME_INPUT_OUTPUT":
            return "Input and output tokens are the same";
    }
}

const SwapStatusIndicator: FC<SwapStatusProps> = ({ entry }) => {
    const { errors } = entry;
    const hasRoute = entry.status == "ROUTING" && entry.route;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className="px-1 h-full">
                    <div
                        className={cn(
                            "w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0",
                            !hasRoute && "bg-gray-400",
                            errors?.length && "bg-yellow-400",
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

                    {errors && (
                        <>
                            <p className="font-semibold">Swap excluded</p>
                            <Separator />
                            <ul>
                                {errors.map((error) => (
                                    <li key={error}>
                                        - {getHumanReadableError(error)}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {!hasRoute && !errors?.length && (
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
