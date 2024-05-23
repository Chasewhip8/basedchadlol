import { FC } from "react";
import { Skeleton } from "./ui/skeleton";

const Loading: FC = () => {
    return (
        <div className="flex flex-col gap-y-2">
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    );
};

export default Loading;
