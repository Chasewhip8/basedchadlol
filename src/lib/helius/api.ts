import { Transaction } from "@solana/web3.js";
import { CLUSTER_URL } from "../config";
import { DAS, PriorityLevel } from "./types";
import bs58 from "bs58";

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

export async function getPriorityFeeEstimate(
    transaction: Transaction,
    priorityLevel: PriorityLevel,
): Promise<{ result: { priorityFeeEstimate: number } }> {
    return fetch(CLUSTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getPriorityFeeEstimate",
            params: [
                {
                    transaction: bs58.encode(transaction.serialize()), // Pass the serialized transaction in Base58
                    options: { priorityLevel: priorityLevel },
                },
            ],
        }),
    }).then((res) => res.json());
}
