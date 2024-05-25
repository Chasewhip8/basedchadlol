import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import React from "react";
import { useToken } from "@/store/hooks";
import { UNKOWN_TOKEN } from "@/lib/token";
import { ChevronDownIcon, FileQuestionIcon } from "lucide-react";
import TokenIcon from "./TokenIcon";

const TokenButton = React.forwardRef<
    React.ElementRef<typeof Button>,
    React.ComponentPropsWithoutRef<typeof Button> & { tokenAddress: string }
>(({ className, tokenAddress, ...props }, ref) => {
    const token = useToken(tokenAddress) ?? UNKOWN_TOKEN;

    return (
        <Button
            className={cn("max-w-40 w-full h-full justify-start", className)}
            ref={ref}
            variant="secondary"
            {...props}
        >
            <TokenIcon token={token} className="mr-2" />
            {token.symbol}
            <ChevronDownIcon className="w-5 ml-auto" />
        </Button>
    );
});
TokenButton.displayName = "TokenButton";

export default TokenButton;
