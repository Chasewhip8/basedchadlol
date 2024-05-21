import { Button } from "./ui/button";
import Link from "next/link";
import React, { FC } from "react";
import { cn } from "@/lib/utils";

const NavButton = React.forwardRef<
    React.ElementRef<typeof Link>,
    React.ComponentPropsWithoutRef<typeof Link> & { disabled?: boolean }
>(
  ({ className, children, disabled, ...props }, ref) => {
      const Inner: FC = () => (
          <Button disabled={disabled} variant="link" className={cn("text-lg font-semibold", className)}>
              {children}
          </Button>
      );

    return (
        disabled ? (
            <Inner/>
        ) : (
            <Link
              ref={ref}
              {...props}
            >
              <Inner />
            </Link>
        )
    )
  }
)
NavButton.displayName = "NavButton"

export default NavButton;
