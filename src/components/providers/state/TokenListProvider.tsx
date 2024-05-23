import useStore from "@/store/store";
import { FC, PropsWithChildren } from "react";

const TokenListProvider: FC<PropsWithChildren> = ({ children }) => {
    return children;
};

export const TokenListGuard: FC<PropsWithChildren> = ({ children }) => {
    const tokenList = useStore((state) => state.);

    return children;
};

export default TokenListProvider;
