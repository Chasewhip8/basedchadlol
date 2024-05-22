import { Button } from "./ui/button";
import Link from "next/link";
import React, { FC } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";

const NavButton = React.forwardRef<
    React.ElementRef<typeof Link>,
    React.ComponentPropsWithoutRef<typeof Link> & { disabled?: boolean }
>(({ className, href, children, disabled, ...props }, ref) => {
    const { asPath } = useRouter();

    const Inner: FC = () => (
        <Button
            disabled={disabled}
            variant="ghost"
            className={cn(
                "text-lg font-semibold",
                asPath == href && "gradient-text",
                className,
            )}
        >
            {children}
        </Button>
    );

    return disabled ? (
        <Inner />
    ) : (
        <Link ref={ref} href={href} {...props}>
            <Inner />
        </Link>
    );
});
NavButton.displayName = "NavButton";

export default NavButton;
