import { FC, PropsWithChildren } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { SettingsIcon } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import useStore from "@/store/store";

const SettingsDropdown: FC<PropsWithChildren> = ({ children }) => {
    const [
        autoSlippage,
        maxSlippageBps,
        maxAutoSlippageBps,
        setAutoSlippage,
        setMaxSlippageBps,
        setMaxAutoSlippageBps,
    ] = useStore((state) => [
        state.autoSlippage,
        state.maxSlippageBps,
        state.maxAutoSlippageBps,
        state.setAutoSlippage,
        state.setMaxSlippageBps,
        state.setMaxAutoSlippageBps,
    ]);

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="max-w-96 w-full">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Settings</h4>
                        <p className="text-sm text-muted-foreground">
                            Adjust settings that apply globaly to all protocols.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="" htmlFor="autoSlippage">
                                Auto Slippage
                            </Label>
                            <Switch
                                checked={autoSlippage}
                                onCheckedChange={setAutoSlippage}
                                id="autoSlippage"
                                className="col-span-2 ml-auto"
                            />
                        </div>
                        {autoSlippage ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    className="col-span-2"
                                    htmlFor="maxSlippage"
                                >
                                    Max Auto Slippage (%)
                                </Label>
                                <Input
                                    value={maxAutoSlippageBps / 100}
                                    onChange={(e) =>
                                        setMaxAutoSlippageBps(
                                            parseFloat(e.currentTarget.value) *
                                                100,
                                        )
                                    }
                                    id="maxSlippage"
                                    type="number"
                                    className="col-span-2 h-8 text-right"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    className="col-span-2"
                                    htmlFor="maxSlippage"
                                >
                                    Max Slippage (%)
                                </Label>
                                <Input
                                    value={maxSlippageBps / 100}
                                    onChange={(e) =>
                                        setMaxSlippageBps(
                                            parseFloat(e.currentTarget.value) *
                                                100,
                                        )
                                    }
                                    id="maxSlippage"
                                    type="number"
                                    className="col-span-2 h-8 text-right"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const SettingsDropdownCog: FC = () => {
    return (
        <SettingsDropdown>
            <Button
                variant="outline"
                size="icon"
                className="rounded-full h-12 w-12 flex-shrink-0"
            >
                <SettingsIcon />
            </Button>
        </SettingsDropdown>
    );
};

export default SettingsDropdown;
