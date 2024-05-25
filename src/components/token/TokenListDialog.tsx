import React, { FC, PropsWithChildren, useMemo, useRef, useState } from "react";
import {
    DialogDescription,
    DialogHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import useStore from "@/store/store";
import Loading from "../Loading";
import Image from "next/image";
import { CheckIcon, FileQuestionIcon } from "lucide-react";
import { TokenList } from "@/lib/token";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import TokenIcon from "./TokenIcon";

interface TokenListDialogProps {
    onSelect?: (address: string) => void;
    selectedTokens?: (string | null)[];
    closeOnSelect?: boolean;
    open?: boolean;
    setOpen?: (open: boolean) => void;
}

const TokenListDialog: FC<PropsWithChildren<TokenListDialogProps>> = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    ...props
}) => {
    const tokenList = useStore((state) => state.cachedFilteredTokenList);
    const [openInternal, setOpenInternal] = useState(false);
    const [open, setOpen] =
        openProp && setOpenProp
            ? [openProp, setOpenProp]
            : [openInternal, setOpenInternal];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="h-3/4 max-w-2xl flex flex-col">
                {tokenList ? (
                    <TokenListDialogContents
                        {...props}
                        tokenList={tokenList}
                        setOpen={setOpen}
                    />
                ) : (
                    <Loading />
                )}
            </DialogContent>
        </Dialog>
    );
};

const TokenListDialogContents: FC<
    TokenListDialogProps & {
        tokenList: TokenList;
        setOpen: (open: boolean) => void;
    }
> = ({ tokenList, onSelect, selectedTokens, closeOnSelect, setOpen }) => {
    const rawTokenAddresses = useMemo(
        () => tokenList && Object.keys(tokenList),
        [tokenList],
    );

    const [searchTerm, setSearchTerm] = useState("");
    const tokenAddresses = useMemo(() => {
        if (!searchTerm) {
            return rawTokenAddresses;
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return rawTokenAddresses.filter((address) => {
            const token = tokenList[address];
            return (
                token.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
                token.symbol?.toLowerCase().includes(lowerCaseSearchTerm) ||
                token.address.toLowerCase().includes(lowerCaseSearchTerm)
            );
        });
    }, [rawTokenAddresses, tokenList, searchTerm]);

    const parentRef = useRef(null);

    const rowVirtualizer = useVirtualizer({
        count: tokenAddresses?.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 15,
    });

    return (
        <>
            <DialogHeader>
                <DialogTitle>Select Token(s)</DialogTitle>
                <DialogDescription></DialogDescription>
            </DialogHeader>
            <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                placeholder="Search for a token"
                className="h-max"
            />
            <ScrollArea ref={parentRef}>
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                    }}
                    className="w-full relative"
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const address = tokenAddresses[virtualItem.index];
                        const token = tokenList[address];
                        const naturalBalance =
                            token.balance &&
                            token.balance / 10 ** token.decimals;

                        return (
                            <div
                                key={virtualItem.key}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="flex flex-row cursor-pointer items-center gap-x-3 hover:bg-secondary/80 rounded-md pl-3 pr-5"
                                onClick={() => {
                                    if (
                                        selectedTokens &&
                                        closeOnSelect &&
                                        !selectedTokens.includes(token.address)
                                    ) {
                                        setOpen(false);
                                    }

                                    if (onSelect) {
                                        onSelect(token.address);
                                    }
                                }}
                            >
                                <TokenIcon token={token} className="mr-2" />
                                {token.symbol}
                                <span className="text-foreground/60 max-w-40 truncate whitespace-nowrap text-ellipsis">
                                    {token.name}
                                </span>
                                {naturalBalance && (
                                    <div className="text-foreground/60 ml-auto flex flex-col text-right">
                                        {Number.parseFloat(
                                            naturalBalance.toFixed(
                                                token.decimals,
                                            ),
                                        )}
                                        {token.price && (
                                            <span>
                                                $
                                                {(
                                                    naturalBalance * token.price
                                                ).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <span className="text-primary w-5 pl-1">
                                    {selectedTokens?.includes(
                                        token.address,
                                    ) && <CheckIcon />}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </>
    );
};

export default TokenListDialog;
