import Loading from "@/components/Loading";
import { Token } from "@/lib/token";
import useStore from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { FC, PropsWithChildren, useEffect } from "react";

const TokenListProvider: FC<PropsWithChildren> = ({ children }) => {
    const { data } = useQuery<Token[]>({
        queryKey: ["jupiter-token-list"],
        queryFn: () =>
            fetch("https://token.jup.ag/all").then((res) => res.json()),
    });

    const { setTokenList } = useStore();
    useEffect(() => {
        if (data) {
            setTokenList(data);
        }
    }, [data, setTokenList]);

    return children;
};

export const TokenListGuard: FC<PropsWithChildren> = ({ children }) => {
    const tokenList = useStore((state) => state.cachedFilteredTokenList);
    if (!tokenList) {
        return <Loading />;
    }
    return children;
};

export default TokenListProvider;
