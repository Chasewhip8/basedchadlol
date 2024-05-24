import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[400px]",
            className,
        )}
        {...props}
    />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const InfoTooltipTrigger = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.TooltipTrigger>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.TooltipTrigger>
>(({ className, ...props }, ref) => (
    <TooltipTrigger
        ref={ref}
        className={cn("text-foreground/50 ", className)}
        {...props}
    >
        <InfoIcon className="w-5" />
    </TooltipTrigger>
));
InfoTooltipTrigger.displayName = "InfoTooltipTrigger";

export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    InfoTooltipTrigger,
};
