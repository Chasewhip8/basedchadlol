import { FC } from "react";
import { Card } from "../ui/card";
import { TriangleAlert } from "lucide-react";

interface SwapWarningProps {
    message: string;
}

const SwapWarning: FC<SwapWarningProps> = ({ message }) => {
    return (
        <Card className="p-3 mt-3 flex flex-row gap-x-4 items-center text-yellow-400">
            <TriangleAlert className="w-6 h-6 flex-shrink-0" />
            <span className="font-semibold">WARNING:</span> {message}
        </Card>
    );
};

export default SwapWarning;
