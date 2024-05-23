type JupiterTags =
    | "old-registry"
    | "community"
    | "wormhole"
    | "solana-fm"
    | "unknown"
    | "token-2022";

export type Token = {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string;
    tags: JupiterTags[];
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
                return true;
        }
    }
    return false;
}
