import { TOKEN_MINT } from "./config";

type JupiterTags =
    | "old-registry"
    | "community"
    | "wormhole"
    | "solana-fm"
    | "unknown"
    | "token-2022";

type CustomTags = "helius";

export type Token = {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    tags: (JupiterTags | CustomTags)[];
    logoURI?: string;
    price?: number;
    balance?: number;
};

export type TokenList = {
    [key: string]: Token;
};

export function isStrictToken(token: Token): boolean {
    for (let i = 0; i < token.tags.length; i++) {
        switch (token.tags[i]) {
            case "old-registry":
            case "community":
            case "wormhole":
            case "helius":
                return true;
        }
    }
    return false;
}

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

export const SOL_TOKEN: Token = {
    address: WRAPPED_SOL_MINT,
    chainId: 101,
    decimals: 9,
    name: "Solana",
    symbol: "SOL",
    logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["old-registry"],
    price: 0,
    balance: 0,
};

export const BSC_TOKEN: Token = {
    address: TOKEN_MINT,
    chainId: 101,
    decimals: 6,
    name: "Based Solana Chad",
    symbol: "BSC",
    logoURI:
        "https://cf-ipfs.com/ipfs/Qmezk4waYtRKMH4TaN81m9TcVX35rccWS7ioCvWJWmTKim",
    tags: ["old-registry"],
    price: 0,
    balance: 0,
};

// For display purposes only.
export const UNKOWN_TOKEN: Token = {
    address: "unknown",
    chainId: 0,
    decimals: 0,
    name: "Unknown",
    symbol: "UNKOWN",
    logoURI: "",
    tags: [],
    price: 0,
    balance: 0,
};
