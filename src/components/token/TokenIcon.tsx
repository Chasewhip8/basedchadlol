import { Token } from "@/lib/token";
import { FileQuestionIcon } from "lucide-react";
import Image from "next/image";
import React from "react";
import { cn } from "@/lib/utils";

interface TokenIconProps {
    token: Token;
}

const TokenIcon = React.forwardRef<
    HTMLSpanElement,
    React.ButtonHTMLAttributes<HTMLSpanElement> & TokenIconProps
>(({ className, token, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(
                "rounded-full overflow-clip flex-shrink-0 w-6 h-6",
                className,
            )}
            {...props}
        >
            {token?.logoURI ? (
                <Image
                    loading="lazy"
                    src={token.logoURI}
                    alt={`Logo of ${token.symbol}`}
                    width={24}
                    height={24}
                    className="w-6 h-6"
                />
            ) : (
                <FileQuestionIcon className="w-6 h-6" />
            )}
        </span>
    );
});
TokenIcon.displayName = "TokenIcon";

export default TokenIcon;
