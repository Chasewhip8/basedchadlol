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
    logoURI?: string;
    tags: (JupiterTags | CustomTags)[];
};

export type TokenList = {
    [key: string]: Token;
};

export type TokenWithInfo = Token & {
    price: number;
    balance: number;
};

export type TokenWithInfoList = {
    [key: string]: TokenWithInfo;
};

export function isStrictToken(token: Token): boolean {
    for (let i = 0; i < token.tags.length; i++) {
        switch (token.tags[i]) {
            case "old-registry":
            case "community":
            case "wormhole":
                return true;
        }
    }
    return false;
}

export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

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
