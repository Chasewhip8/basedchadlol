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
import { XIcon } from "lucide-react";
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

const Swap: NextPageWithLayout = () => {
    const [
        inputTokens,
        addInputToken,
        removeInputToken,
        clearInputToken,
        setInputTokensPercentageAmount,
    ] = useStore((state) => [
        state.inputTokens,
        state.addInputToken,
        state.removeInputToken,
        state.clearInputTokens,
        state.setInputTokensPercentageAmount,
    ]);

    const inputTokenAddresses = useMemo(
        () => inputTokens.map((t) => t.tokenAddress),
        [inputTokens],
    );

    const [outputToken, setOutputToken] = useStore((state) => [
        state.outputToken,
        state.setOutputToken,
    ]);

    const onInputTokenSelect = (tokenAddress: string) => {
        if (inputTokenAddresses.includes(tokenAddress)) {
            removeInputToken(tokenAddress);
        } else {
            addInputToken(tokenAddress);
        }
    };

    const [inputTokenListOpen, setInputTokenListOpen] = useState(false);

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
                        here
                    </Button>
                    .
                </p>
            </div>

            <div>
                <Card className="p-6 rounded-b-none flex flex-col gap-y-3">
                    <div className="flex flec-row flex-nowrap items-center gap-x-0.5">
                        <Label>You{"'"}re paying</Label>

                        <Button
                            className="ml-auto"
                            variant="secondary"
                            size="xs"
                            onClick={clearInputToken}
                        >
                            Clear All
                        </Button>

                        <Button variant="secondary" size="xs">
                            Add Dust Tokens
                        </Button>

                        <div className="w-0.5 h-4 mx-2 rounded-md bg-border"></div>

                        <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setInputTokensPercentageAmount(0.5)}
                        >
                            Half
                        </Button>
                        <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setInputTokensPercentageAmount(1)}
                        >
                            Max
                        </Button>
                    </div>
                    <Separator />
                    <TokenListGuard>
                        <div className="flex flex-col gap-y-3">
                            {inputTokens.map(
                                ({ tokenAddress, naturalAmount }) => (
                                    <div
                                        key={tokenAddress}
                                        className="flex flex-row gap-x-2 h-11"
                                    >
                                        <TokenButton
                                            tokenAddress={tokenAddress}
                                            onClick={() =>
                                                setInputTokenListOpen(true)
                                            }
                                        />
                                        <Input
                                            type="number"
                                            value={naturalAmount}
                                            className="text-right h-full [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                        />
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
                                    </div>
                                ),
                            )}

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

                            <Input
                                disabled
                                className="text-right h-full disabled:opacity-100"
                            />
                        </div>
                    </TokenListGuard>
                </Card>
                <Card className="p-3 mt-5">
                    <Button className="w-full">Swap</Button>
                </Card>
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
