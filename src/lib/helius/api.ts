import {
    AddressLookupTableAccount,
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import { CLUSTER_URL } from "../config";
import { DAS, PriorityLevel } from "./types";
import bs58 from "bs58";
import { CONNECTION } from "../solana";

export async function getUserAssets(
    address: string,
): Promise<{ result: DAS.GetAssetResponseList }> {
    const params: DAS.AssetsByOwnerRequest = {
        ownerAddress: address,
        page: 1,
        limit: 1000,
        displayOptions: {
            showFungible: true,
            showNativeBalance: true,
        },
    };

    return fetch(CLUSTER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getAssetsByOwner",
            params: params,
        }),
        // @ts-ignore
    }).then((res) => res.json());
}

export async function getPriorityFeeEstimate(): Promise<{
    result: { priorityFeeEstimate: number };
}> {
    return fetch(CLUSTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getPriorityFeeEstimate",
            params: [
                {
                    accountKeys: [
                        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
                    ],
                    options: {
                        recommended: true,
                    },
                },
            ],
        }),
    }).then((res) => res.json());
}

export async function getAddressLookupTableAccounts(
    keys: string[],
): Promise<AddressLookupTableAccount[]> {
    const addressLookupTableAccountInfos =
        await CONNECTION.getMultipleAccountsInfo(
            keys.map((key) => new PublicKey(key)),
        );

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
        const addressLookupTableAddress = keys[index];
        if (accountInfo) {
            const addressLookupTableAccount = new AddressLookupTableAccount({
                key: new PublicKey(addressLookupTableAddress),
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
            acc.push(addressLookupTableAccount);
        }

        return acc;
    }, new Array<AddressLookupTableAccount>());
}
