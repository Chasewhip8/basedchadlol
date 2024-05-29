import {
    AddressLookupTableAccount,
    PublicKey,
    Transaction,
    TransactionSignature,
    VersionedTransaction,
} from "@solana/web3.js";
import { CLUSTER_URL, HELIUS_MAX_RETIRES } from "../config";
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

async function pollTransactionConfirmation(
    txtSig: TransactionSignature,
): Promise<TransactionSignature> {
    // 15 second timeout
    const timeout = 15000;
    // 5 second retry interval
    const interval = 5000;
    let elapsed = 0;

    return new Promise<TransactionSignature>((resolve, reject) => {
        const intervalId = setInterval(async () => {
            elapsed += interval;

            if (elapsed >= timeout) {
                clearInterval(intervalId);
                reject(
                    new Error(`Transaction ${txtSig}'s confirmation timed out`),
                );
            }

            const status = await CONNECTION.getSignatureStatus(txtSig);

            if (status?.value?.confirmationStatus === "confirmed") {
                clearInterval(intervalId);
                resolve(txtSig);
            }
        }, interval);
    });
}

export async function sendHeliusTransaction(
    transactions: { tx: VersionedTransaction; txId: string }[],
    transactionStatusCallback: (txId: string, confirmed: boolean) => void,
) {
    await Promise.all(
        transactions.map(async ({ tx, txId }) => {
            try {
                let retryCount = 0;
                let txtSig: string;

                // Send the transaction with configurable retries and preflight checks
                while (retryCount <= HELIUS_MAX_RETIRES) {
                    try {
                        txtSig = await CONNECTION.sendRawTransaction(
                            tx.serialize(),
                            {
                                skipPreflight: true,
                                maxRetries: 0,
                            },
                        );

                        await pollTransactionConfirmation(txtSig);
                        transactionStatusCallback(txId, true);
                        return;
                    } catch (error) {
                        if (retryCount === HELIUS_MAX_RETIRES) {
                            transactionStatusCallback(txId, false);
                            console.error(
                                `Error sending transaction: ${error}`,
                            );
                            return;
                        }

                        retryCount++;
                    }
                }
            } catch (error) {
                transactionStatusCallback(txId, false);
                console.error(`Error sending transaction: ${error}`);
                return;
            }
        }),
    );
}
