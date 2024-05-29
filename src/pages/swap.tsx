import DefaultLayout from "@/components/DefaultLayout";
import { ReactElement, useMemo, useState } from "react";
import { NextPageWithLayout } from "./_app";
import { Card } from "@/components/ui/card";
import TokenListProvider, {
    TokenListGuard,
} from "@/components/providers/state/TokenListProvider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowRightIcon, MoveRightIcon, XIcon } from "lucide-react";
import {
    InfoTooltipTrigger,
    Tooltip,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip";
import TokenButton from "@/components/token/TokenButton";
import UserBalanceProvider from "@/components/providers/state/UserBalanceProvider";
import TokenListDialog from "@/components/token/TokenListDialog";
import useStore from "@/store/store";
import { WalletIcon } from "lucide-react";
import { convertTokenLamportsToNatural } from "@/lib/token";
import { Skeleton } from "@/components/ui/skeleton";
import SwapStatusIndicator from "@/components/SwapStatusIndicator";
import SwapButton from "@/components/swap/SwapButton";
import TokenIcon from "@/components/token/TokenIcon";
import SwapIntentIndicator from "@/components/SwapIntentIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";

const Swap: NextPageWithLayout = () => {
    const [
        addInputToken,
        removeInputToken,
        clearInputToken,
        setInputTokensPercentageAmount,
        setInputTokenAmount,
        setOutputToken,
        addDustInputTokens,
        swapIntents,
    ] = useStore((state) => [
        state.addInputToken,
        state.removeInputToken,
        state.clearInputTokens,
        state.setInputTokensPercentageAmount,
        state.setInputTokenAmount,
        state.setOutputToken,
        state.addDustInputTokens,
        state.swapIntents,
    ]);

    const [inputTokens, outputToken] = useStore((state) => [
        state.inputTokens,
        state.outputToken,
    ]);

    const inputTokenAddresses = useMemo(
        () => inputTokens.map((t) => t.tokenAddress),
        [inputTokens],
    );

    const onInputTokenSelect = (tokenAddress: string) => {
        if (inputTokenAddresses.includes(tokenAddress)) {
            removeInputToken(tokenAddress);
        } else {
            addInputToken(tokenAddress);
        }
    };

    const [inputTokenListOpen, setInputTokenListOpen] = useState(false);
    const tokenList = useStore((state) => state.cachedFilteredTokenList);

    const totalOutAmount = useMemo<number | null>(() => {
        let total = 0;
        for (const inputToken of inputTokens) {
            if (inputToken.route?.jupiterQuote) {
                total += parseFloat(inputToken.route.jupiterQuote.outAmount);
            }
        }
        return total;
    }, [inputTokens]);

    return (
        <div className="flex flex-col gap-y-4 justify-start my-20 max-w-[600px]">
            <div className="space-y-1">
                <span className="text-4xl font-bold gradient-text">
                    ChadSwap
                </span>

                <p>
                    Swap multiple tokens at once with MEV protection via Helius
                    RPCs. Learn about how fees are used to sustain the based
                    protocol ecosystem{" "}
                    <Button className="p-0 h-min text-md m-0" variant="link">
                        here (coming soon)
                    </Button>
                    .
                </p>
            </div>

            <div>
                <Card className="p-6 rounded-b-none flex flex-col gap-y-3">
                    <div className="flex flec-row flex-nowrap items-center">
                        <Label className="flex-shrink-0">
                            You{"'"}re paying
                        </Label>

                        <div className="flex flex-row ml-auto flex-wrap justify-end gap-1">
                            <div className="flex flex-row gap-1">
                                <Button
                                    variant="secondary"
                                    size="xs"
                                    onClick={clearInputToken}
                                >
                                    Clear All
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="xs"
                                    onClick={addDustInputTokens}
                                >
                                    Add Dust Tokens
                                </Button>
                            </div>

                            <div className="hidden sm:block w-0.5 h-4 mx-2 my-auto rounded-md bg-border" />

                            <div className="flex flex-row gap-1">
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() =>
                                        setInputTokensPercentageAmount(0.5)
                                    }
                                >
                                    Half
                                </Button>
                                <Button
                                    variant="outline"
                                    size="xs"
                                    onClick={() =>
                                        setInputTokensPercentageAmount(1)
                                    }
                                >
                                    Max
                                </Button>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <TokenListGuard>
                        <div className="flex flex-col gap-y-3">
                            {inputTokens.map((entry) => {
                                const { tokenAddress, naturalAmount } = entry;

                                const token =
                                    tokenList && tokenList[tokenAddress];
                                return (
                                    <div
                                        key={tokenAddress}
                                        className="flex flex-row gap-x-2 h-11 items-center"
                                    >
                                        <TokenButton
                                            tokenAddress={tokenAddress}
                                            onClick={() =>
                                                setInputTokenListOpen(true)
                                            }
                                        />
                                        <div className="relative w-full h-full">
                                            <span className="hidden sm:flex absolute left-2.5 top-0 bottom-0 my-auto  flex-row items-center gap-x-1 text-foreground/60 text-xs">
                                                <WalletIcon className="w-3 h-3 mr-0.5" />
                                                {convertTokenLamportsToNatural(
                                                    token,
                                                    token?.balance,
                                                )}
                                            </span>

                                            <Input
                                                type="number"
                                                value={naturalAmount}
                                                onChange={(e) =>
                                                    setInputTokenAmount(
                                                        tokenAddress,
                                                        e.target.value,
                                                    )
                                                }
                                                className="text-right h-full [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-full w-12 text-card-foreground/80 hover:bg-destructive/90"
                                            onClick={() =>
                                                removeInputToken(tokenAddress)
                                            }
                                        >
                                            <XIcon className="w-5" />
                                        </Button>
                                        <SwapStatusIndicator entry={entry} />
                                    </div>
                                );
                            })}

                            <TokenListDialog
                                selectedTokens={inputTokenAddresses}
                                onSelect={onInputTokenSelect}
                                open={inputTokenListOpen}
                                setOpen={setInputTokenListOpen}
                            >
                                <Button variant="secondary" className="w-full">
                                    Add Tokens
                                </Button>
                            </TokenListDialog>
                        </div>
                    </TokenListGuard>
                </Card>
                <Card className="p-6 rounded-t-none border-t-0 flex flex-col gap-y-3">
                    <div className="flex flec-row flex-nowrap items-center gap-x-2">
                        <Label>To receive</Label>

                        <TooltipProvider>
                            <Tooltip>
                                <InfoTooltipTrigger />
                                <TooltipContent>
                                    <p>
                                        All swaps are using the best route
                                        possible through Jupiter{"'"}s v6 swap
                                        API. Depending on your settings,
                                        transactions may be included inside of a
                                        Jito bundle to force all swaps to be
                                        successful for any to be completed.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    <TokenListGuard>
                        <div className="flex flex-row gap-x-2 h-11">
                            <TokenListDialog
                                selectedTokens={[outputToken]}
                                onSelect={setOutputToken}
                                closeOnSelect
                            >
                                <TokenButton tokenAddress={outputToken} />
                            </TokenListDialog>

                            {totalOutAmount && tokenList ? (
                                <div className="h-full flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-not-allowed">
                                    <span className="ml-auto my-auto">
                                        {convertTokenLamportsToNatural(
                                            tokenList[outputToken],
                                            totalOutAmount,
                                        )}
                                    </span>
                                </div>
                            ) : (
                                <Skeleton className="flex items-center h-full w-full rounded-md border border-input bg-background cursor-not-allowed">
                                    <Skeleton className="h-4 w-2/5 ml-auto mr-2 opacity-40" />
                                </Skeleton>
                            )}
                        </div>
                    </TokenListGuard>
                </Card>
                <Card className="p-3 mt-3">
                    <SwapButton />
                </Card>
                <div className="flex flex-col gap-y-2 mt-10">
                    <Label className="text-lg">Swap History</Label>

                    <Card className="p-3 flex">
                        {swapIntents.length > 0 ? (
                            <ScrollArea className="max-h-[300px]  w-full">
                                <div className="flex flex-col gap-y-3 w-full">
                                    {swapIntents.map((intent) => {
                                        const token =
                                            tokenList &&
                                            tokenList[intent.outputToken];

                                        return (
                                            <Card
                                                key={intent.intentId}
                                                className="bg-secondary text-secondary-foreground p-4 flex flex-row gap-x-2 items-center "
                                            >
                                                <div className="flex flex-row gap-x-3">
                                                    <div className="flex flex-row mr-3">
                                                        {intent.transactions
                                                            .slice(0, 7)
                                                            .map(
                                                                (
                                                                    transactionInfo,
                                                                ) => {
                                                                    const inputToken =
                                                                        tokenList &&
                                                                        tokenList[
                                                                            transactionInfo
                                                                                .inputTokenAddress
                                                                        ];
                                                                    return (
                                                                        <span
                                                                            className="flex overflow-x-visible w-3"
                                                                            key={
                                                                                transactionInfo.inputTokenAddress
                                                                            }
                                                                        >
                                                                            {inputToken && (
                                                                                <TokenIcon
                                                                                    token={
                                                                                        inputToken
                                                                                    }
                                                                                />
                                                                            )}
                                                                        </span>
                                                                    );
                                                                },
                                                            )}
                                                    </div>

                                                    <MoveRightIcon className="w-5 text-foreground/80" />

                                                    {token && (
                                                        <TokenIcon
                                                            token={token}
                                                        />
                                                    )}
                                                </div>

                                                <span className="font-medium text-foreground/80 truncate text-ellipsis whitespace-nowrap">
                                                    {convertTokenLamportsToNatural(
                                                        token,
                                                        intent.outAmount,
                                                    )}
                                                </span>

                                                <SwapIntentIndicator
                                                    intent={intent}
                                                />
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        ) : (
                            <span className="m-auto font-medium text-foreground/80">
                                No pending swaps
                            </span>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

Swap.getLayout = function getLayout(page: ReactElement) {
    return (
        <DefaultLayout>
            <TokenListProvider>
                <UserBalanceProvider>{page}</UserBalanceProvider>
            </TokenListProvider>
        </DefaultLayout>
    );
};

export default Swap;
