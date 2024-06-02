import Swap from "@/pages/swap";
import useStore, { SwapIntent } from "@/store/store";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { FC } from "react";
import { Separator } from "../ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface SwapIntentIndicatorProps {
    intent: SwapIntent;
}

const SwapIntentIndicator: FC<SwapIntentIndicatorProps> = ({ intent }) => {
    const completedTransactions = intent.transactions.filter(
        (transaction) => transaction.status === "CONFIRMED",
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="ml-auto font-bold flex flex-row items-center gap-x-2 whitespace-nowrap">
                    {completedTransactions.length} /{" "}
                    {intent.transactions.length}
                    <SwapIntentIndicatorInner intent={intent} />
                </div>
            </PopoverTrigger>
            <PopoverContent sideOffset={-7} className="flex flex-col gap-y-1">
                <SwapIntentTooltip intent={intent} />
            </PopoverContent>
        </Popover>
    );
};

const SwapIntentIndicatorInner: FC<SwapIntentIndicatorProps> = ({ intent }) => {
    switch (intent.status) {
        case "SWAPPING":
        case "PROCESSING":
        case "SENT":
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 animate-spin"
                >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
            );
        case "COMPLETED":
            return <CircleCheck className="mr-2 h-4 w-4 text-green-500" />;
        case "TRANSACTIONS_CREATE_FAILED":
            return <TriangleAlert className="mr-2 h-4 w-4 text-yellow-500" />;
    }
};

const SwapIntentTooltip: FC<SwapIntentIndicatorProps> = ({ intent }) => {
    const failedTransactions = intent.transactions.filter(
        (transaction) => transaction.status === "FAILED",
    );

    const tokenList = useStore((state) => state.cachedFilteredTokenList);

    if (failedTransactions.length > 0) {
        return (
            <p className="flex flex-col gap-y-2">
                Some or all of the swap has failed to complete.{" "}
                {failedTransactions.length} transactions have failed to confirm.
                These transactions still could have been successful, but likely
                not. Please try again.
                <Separator />
                <div className="flex flex-col gap-y-0.5">
                    {failedTransactions.map((ft) => {
                        const maybeInput =
                            tokenList && tokenList[ft.inputTokenAddress];

                        return (
                            <p key={ft.inputTokenAddress}>
                                - {maybeInput?.name || ft.inputTokenAddress}{" "}
                                failed to swap.
                            </p>
                        );
                    })}
                </div>
            </p>
        );
    }

    switch (intent.status) {
        case "SWAPPING":
        case "PROCESSING":
        case "SENT":
            return (
                <p>
                    This swap{"'"}s transactions are currently being processed
                    by the Solana network. Please wait for the transactions to
                    be confirmed.
                </p>
            );
        case "COMPLETED":
            return (
                <p>
                    This swap has been successfully completed.{" "}
                    {intent.transactions.length} transactions have been
                    confirmed.
                </p>
            );
        case "TRANSACTIONS_CREATE_FAILED":
            return (
                <p>
                    This swap failed to initalize, this could be due to a
                    failure to sign. Please try again.
                </p>
            );
    }
};

export default SwapIntentIndicator;
