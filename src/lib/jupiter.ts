import { Instruction, createJupiterApiClient } from "@jup-ag/api";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export const JUPITER_API = createJupiterApiClient();

export function deserializeInstruction(instruction: Instruction) {
    return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
        })),
        data: Buffer.from(instruction.data, "base64"),
    });
}
