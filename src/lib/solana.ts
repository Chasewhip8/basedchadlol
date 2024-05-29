import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import {
    BLOCKHASH_MAX_AGE_MS,
    CLUSTER_URL,
    FEE_LAMPORTS,
    FEE_WALLET,
} from "./config";
import { Mutex } from "async-mutex";

export const CONNECTION = new Connection(CLUSTER_URL);

// const BLOCHASH_FETCH_MUTEX = new Mutex();
// let lastFetchedBlockHash: string | null = null;
// let lastFetchedBlockHashTime: number = 0;
// export async function getAtomicLatestBlockHash() {
//     await BLOCHASH_FETCH_MUTEX.waitForUnlock();

//     if (
//         lastFetchedBlockHash &&
//         Date.now() - lastFetchedBlockHashTime < BLOCKHASH_MAX_AGE_MS
//     ) {
//         return lastFetchedBlockHash;
//     }

//     if (!BLOCHASH_FETCH_MUTEX.isLocked()) {
//         const release = await BLOCHASH_FETCH_MUTEX.acquire();

//         try {
//             lastFetchedBlockHash = (await CONNECTION.getLatestBlockhash())
//                 .blockhash;
//             lastFetchedBlockHashTime = Date.now();

//             return lastFetchedBlockHash;
//         } finally {
//             release();
//         }
//     } else {
//         return await getAtomicLatestBlockHash();
//     }
// }

export function appendFeeInstructions(transaction: Transaction) {
    if (!transaction.feePayer) {
        throw Error("solana::appendFeeInstructions::NO_FEE_PAYER");
    }

    transaction.instructions.push(
        SystemProgram.transfer({
            fromPubkey: transaction.feePayer,
            toPubkey: new PublicKey(FEE_WALLET),
            lamports: FEE_LAMPORTS,
        }),
    );
}

export async function sendAndConfirmTransaction(transaction: Transaction) {}
