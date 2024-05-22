import DefaultLayout from "@/components/DefaultLayout";
import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";
import { Card, CardContent } from "@/components/ui/card";
import MultiTokenSelect from "@/components/swap/MultiTokenSelect";

const Swap: NextPageWithLayout = () => {
    return (
        <div className="flex flex-col gap-y-4 justify-start mt-20 max-w-[600px]">
            <div className="space-y-1">
                <span className="text-4xl font-bold gradient-text">
                    ChadSwap
                </span>

                <p>
                    Swap multiple tokens at once with MEV protection via leading
                    RPC providers. All fees are directed towards the BasedDAO
                    treasury. Swaps to $BSC have 0% fees.
                </p>
            </div>

            <div>
                <Card className="p-6 rounded-b-none">
                    <MultiTokenSelect />
                </Card>
                <Card className="p-6 rounded-t-none"></Card>
            </div>
        </div>
    );
};

Swap.getLayout = function getLayout(page: ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>;
};

export default Swap;
