import { CLUSTER_URL, SOL_LAMORTS_RESERVED } from "@/lib/config";
import { DAS } from "@/lib/helius/types";
import { getUserAssets } from "@/lib/helius/api";
import { Token, SOL_TOKEN } from "@/lib/token";
import useStore from "@/store/store";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { FC, PropsWithChildren, useEffect } from "react";

const UserBalanceProvider: FC<PropsWithChildren> = ({ children }) => {
    const wallet = useWallet();
    const address = wallet?.publicKey?.toBase58();

    const { data } = useQuery<{ result: DAS.GetAssetResponseList }>({
        queryKey: ["helius-user-balances", address],
        queryFn: () => getUserAssets(address as string),
        enabled: Boolean(address), // Only run when there is a valid wallet address
    });

    const { setHeliusTokenList: setTokenInfoList } = useStore();
    useEffect(() => {
        if (!data) {
            return;
        }

        const tokens: Token[] = data.result.nativeBalance
            ? [
                  {
                      ...SOL_TOKEN,
                      balance: Math.max(
                          0,
                          data.result.nativeBalance.lamports -
                              SOL_LAMORTS_RESERVED,
                      ),
                      price: data.result.nativeBalance.price_per_sol,
                  },
              ]
            : [];

        const items = data.result.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.ownership.frozen || item.interface != "FungibleToken") {
                continue;
            }
            const tokenInfo = item.token_info;
            tokens.push({
                address: item.id,
                chainId: 101,
                decimals: tokenInfo.decimals,
                name: item.content?.metadata.name || tokenInfo.symbol,
                symbol: tokenInfo.symbol,
                logoURI: item.content?.links?.image,
                tags: ["helius"],
                price: tokenInfo.price_info?.price_per_token || 0,
                balance: tokenInfo.balance,
            });
        }
        setTokenInfoList(tokens);
    }, [data, setTokenInfoList]);

    return children;
};

export default UserBalanceProvider;
