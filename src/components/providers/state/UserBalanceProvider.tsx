import { CLUSTER_URL } from "@/lib/config";
import { DAS } from "@/lib/helius";
import { TokenWithInfoList } from "@/lib/token";
import useStore from "@/store/store";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { FC, PropsWithChildren, useEffect } from "react";

const UserBalanceProvider: FC<PropsWithChildren> = ({ children }) => {
    const wallet = useWallet();
    const address = wallet?.publicKey?.toBase58();

    const { data } = useQuery<{ result: DAS.GetAssetResponseList }>({
        queryKey: ["helius-user-balances", address],
        queryFn: () =>
            fetch(CLUSTER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: "1",
                    method: "getAssetsByOwner",
                    params: {
                        ownerAddress: address,
                        page: 1, // Starts at 1
                        limit: 1000,
                        displayOptions: {
                            showFungible: true,
                            showNativeBalance: true,
                        },
                    },
                }),
                // @ts-ignore
            }).then((res) => res.json()),
        enabled: Boolean(address), // Only run when there is a valid wallet address
    });

    const { setTokenInfoList } = useStore();
    useEffect(() => {
        if (!data) {
            return;
        }

        const tokenWithInfo: TokenWithInfoList = {};

        const items = data.result.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.ownership.frozen || item.interface != "FungibleToken") {
                continue;
            }
            console.log(item);
            const tokenInfo = item.token_info;
            tokenWithInfo[item.id] = {
                address: item.id,
                chainId: 101,
                decimals: tokenInfo.decimals,
                name: item.content?.metadata.name || tokenInfo.symbol,
                symbol: tokenInfo.symbol,
                logoURI: item.content?.links?.image,
                tags: ["helius"],
                price: tokenInfo.price_info?.price_per_token || 0,
                balance: tokenInfo.balance,
            };
        }
        setTokenInfoList(tokenWithInfo);
    }, [data, setTokenInfoList]);

    return children;
};

export default UserBalanceProvider;
