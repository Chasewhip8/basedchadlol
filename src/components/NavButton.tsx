import { Button } from "./ui/button";
import Link from "next/link";
import React, { FC } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";

const NavButton = React.forwardRef<
    React.ElementRef<typeof Link>,
    React.ComponentPropsWithoutRef<typeof Link> & {
        disabled?: boolean;
        external?: boolean;
    }
>(({ className, href, children, disabled, external, ...props }, ref) => {
    const { asPath } = useRouter();

    const Inner: FC = () => (
        <Button
            disabled={disabled}
            variant="ghost"
            className={cn(
                "text-lg font-semibold flex flex-row gap-x-2",
                className,
            )}
        >
            <span className={cn(asPath == href && "gradient-text")}>
                {children}
            </span>
        </Button>
    );

    return disabled ? (
        <Inner />
    ) : (
        <Link
            ref={ref}
            href={href}
            {...(external && { target: "_blank" })}
            {...props}
        >
            <Inner />
        </Link>
    );
});
NavButton.displayName = "NavButton";

export default NavButton;
