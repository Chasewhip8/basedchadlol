import {
    MIN_JUPITER_ROUTE_REFETCH_INTERVAL,
    RESERVED_FEE_ACCOUNTS,
    SWAP_REFRESH_INTERVAL,
    TOKEN_DUST_MAX_VALUE,
    TOKEN_MINT,
} from "@/lib/config";
import {
    BSC_TOKEN,
    SOL_TOKEN,
    Token,
    TokenList,
    WRAPPED_SOL_MINT,
    convertTokenLamportsToNatural,
    convertTokenNaturalToLamports,
    isStrictToken,
} from "@/lib/token";
import { StateCreator } from "zustand";
import { createWithEqualityFn } from "zustand/traditional";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { original, produce } from "immer";
import { JUPITER_API } from "@/lib/jupiter";
import { QuoteResponse } from "@jup-ag/api";
import {
    selectiveArrayShallow,
    selectiveShallow,
} from "@/lib/selectiveShallow";
import { Transaction, TransactionSignature } from "@solana/web3.js";

export interface CacheSlice {
    tokenList: Token[] | null;
    setTokenList: (list: Token[]) => void;
    heliusTokenList: Token[] | null;
    setHeliusTokenList: (list: Token[]) => void;
    cachedFilteredTokenList: TokenList | null;
    updateCachedFilteredTokenList: () => void;
}

const createCacheSlice: StateCreator<Store, [], [], CacheSlice> = (set) => ({
    tokenList: null,
    setTokenList: (list: Token[]) =>
        set(() => ({
            tokenList: list,
        })),
    heliusTokenList: null,
    setHeliusTokenList: (list: Token[]) =>
        set(() => ({
            heliusTokenList: list,
        })),
    cachedFilteredTokenList: null,
    updateCachedFilteredTokenList: () =>
        set((state) => {
            const cachedList: TokenList = {};

            function addTokenList(tokenList: Token[] | null) {
                if (!tokenList) {
                    return;
                }

                const sorted = Array.from(tokenList).sort((a, b) => {
                    // Sort tokens by thier price * balance, and then by their price, otherwise by their balance.
                    const aPrice = a.price || 0;
                    const bPrice = b.price || 0;
                    const aBalance = a.balance || 0;
                    const bBalance = b.balance || 0;
                    const aSort = aPrice * aBalance;
                    const bSort = bPrice * bBalance;
                    if (aSort > bSort) {
                        return -1;
                    }
                    if (aSort < bSort) {
                        return 1;
                    }
                    if (aPrice > bPrice) {
                        return -1;
                    }
                    if (aPrice < bPrice) {
                        return 1;
                    }
                    if (aBalance > bBalance) {
                        return -1;
                    }
                    if (aBalance < bBalance) {
                        return 1;
                    }
                    return 0;
                });

                const len = sorted.length;
                for (let i = 0; i < len; i++) {
                    const token = sorted[i];
                    if (
                        cachedList.hasOwnProperty(token.address) ||
                        (!state.allowUntrustedTokens && !isStrictToken(token))
                    ) {
                        continue;
                    }
                    cachedList[token.address] = token;
                }
            }

            addTokenList(state.heliusTokenList);
            addTokenList([BSC_TOKEN, SOL_TOKEN]);
            addTokenList(state.tokenList);

            return {
                cachedFilteredTokenList: cachedList,
            };
        }),
});

export interface PersistedGlobalSettings {
    maxSlippageBps: number;
    allowUntrustedTokens: boolean;
}

export interface GlobalSettings extends PersistedGlobalSettings {
    setMaxSlippageBps: (maxSlippageBps: number) => void;
    setAllowUntrustedTokens: (allowUntrustedTokens: boolean) => void;
}

const createGlobalSettingsSlice: StateCreator<Store, [], [], GlobalSettings> = (
    set,
) => ({
    maxSlippageBps: 50,
    setMaxSlippageBps: (maxSlippageBps: number) =>
        set(() => ({
            maxSlippageBps: maxSlippageBps,
        })),
    allowUntrustedTokens: false,
    setAllowUntrustedTokens: (allowUntrustedTokens: boolean) =>
        set(() => ({
            allowUntrustedTokens: allowUntrustedTokens,
        })),
});

export type RoutingStatus =
    | "ROUTING"
    | "NO_ROUTE"
    | "JUPITER_UNKOWN"
    | "SAME_INPUT_OUTPUT"
    | "AMOUNT_TOO_SMALL";

export function isRoutingStatusError(
    status: RoutingStatus,
): status is Exclude<RoutingStatus, "ROUTING"> {
    return status !== "ROUTING";
}

export type InputTokenEntry = {
    tokenAddress: string;
    naturalAmount: string;
    amount: number; // Optimization to prevent the need to fetch on tokenList change. Duplicate state but allowed.
    status: RoutingStatus;
    route?: {
        timeStamp: number;
        jupiterQuote?: QuoteResponse;
    };
};

type TransactionStatus =
    | "PENDING_TRANSACTION"
    | "PENDING_SIGNATURE"
    | "SIGNING"
    | "CONFIRMING";

export type SwapIntent = {
    intentId: number;
    timeStamp: number;
    outputToken: string;
    outAmount: number;
    transactions: {
        inputTokenAddress: string;
        inAmount: number;
        transaction?: Transaction;
        status: TransactionStatus;
    }[];
};

export interface SwapSlice {
    // Input
    inputTokens: InputTokenEntry[];

    addInputToken: (newToken: string) => void;
    addDustInputTokens: () => void;

    setInputTokenAmount: (tokenAddress: string, naturalAmount: string) => void;
    setInputTokensPercentageAmount: (percentage: number) => void;

    removeInputToken: (token: string) => void;
    clearInputTokens: () => void;

    // Output
    outputToken: string;

    setOutputToken: (newToken: string) => void;

    // Route
    setRoute: (
        inputToken: string,
        outputToken: string,
        amount: number,
        timeStamp: number,
        jupiterQuote?: QuoteResponse,
    ) => void;
    setRouteStatus: (inputToken: string, newStatus: RoutingStatus) => void;
    fetchAllRoutes: () => void;

    // Swap
    swapIntents: SwapIntent[];
    swapAllRoutes: () => void;
}

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set, get) => ({
    inputTokens: [
        {
            tokenAddress: WRAPPED_SOL_MINT,
            naturalAmount: "0",
            amount: 0,
            status: "ROUTING",
        },
    ],
    addInputToken: (newToken: string) =>
        set((state) => {
            if (state.inputTokens.find((t) => t.tokenAddress == newToken)) {
                return state;
            }

            const maybeToken =
                state.cachedFilteredTokenList &&
                state.cachedFilteredTokenList[newToken];
            const balance = maybeToken?.balance || 0;
            return {
                inputTokens: [
                    ...state.inputTokens,
                    {
                        tokenAddress: newToken,
                        naturalAmount: convertTokenLamportsToNatural(
                            maybeToken,
                            balance,
                        ).toString(),
                        amount: balance,
                        status: "ROUTING",
                    },
                ],
            };
        }),
    addDustInputTokens: () =>
        set((state) => {
            const tokenList = state.cachedFilteredTokenList;
            if (!tokenList) {
                return state;
            }

            const newTokens: InputTokenEntry[] = [];
            for (const tokenAddress in tokenList) {
                if (!tokenList.hasOwnProperty(tokenAddress)) {
                    continue;
                }

                const token = tokenList[tokenAddress];
                if (!token.balance || !token.price) {
                    continue;
                }

                if (
                    state.inputTokens.find(
                        (t) => t.tokenAddress == tokenAddress,
                    )
                ) {
                    continue;
                }

                if (
                    convertTokenLamportsToNatural(token, token.balance) *
                        token.price <=
                    TOKEN_DUST_MAX_VALUE
                ) {
                    newTokens.push({
                        tokenAddress: tokenAddress,
                        naturalAmount: convertTokenLamportsToNatural(
                            token,
                            token.balance,
                        ).toString(),
                        amount: token.balance,
                        status: "ROUTING",
                    });
                }
            }

            return {
                inputTokens: [...state.inputTokens, ...newTokens],
            };
        }),
    setInputTokenAmount: (tokenAddress: string, naturalAmount: string) =>
        set(
            produce((state: Store) => {
                const token =
                    state.cachedFilteredTokenList &&
                    state.cachedFilteredTokenList[tokenAddress];
                if (!token) {
                    console.warn(
                        "store::swap::setInputTokenAmount::WARN_SET_INPUT_TOKEN_AMOUNT_TOKEN_NOT_FOUND",
                    );
                    return;
                }

                const inputTokenEntry = state.inputTokens.find(
                    (t) => t.tokenAddress === tokenAddress,
                );
                if (!inputTokenEntry) {
                    console.warn(
                        "store::swap::setInputTokenAmount::WARN_SET_INPUT_TOKEN_AMOUNT_ENTRY_NOT_FOUND",
                    );
                    return;
                }

                const newAmount = convertTokenNaturalToLamports(
                    token,
                    naturalAmount,
                );

                if (inputTokenEntry.amount != newAmount) {
                    inputTokenEntry.route = undefined;
                }

                inputTokenEntry.naturalAmount = naturalAmount;
                inputTokenEntry.amount = newAmount;
            }),
        ),
    setInputTokensPercentageAmount: (percentage: number) =>
        set(
            produce((state: Store) => {
                for (const inputTokenEntry of state.inputTokens) {
                    const maybeToken =
                        state.cachedFilteredTokenList &&
                        state.cachedFilteredTokenList[
                            inputTokenEntry.tokenAddress
                        ];

                    if (maybeToken?.balance) {
                        const newAmount = maybeToken.balance * percentage;

                        if (inputTokenEntry.amount != newAmount) {
                            inputTokenEntry.route = undefined;
                        }

                        inputTokenEntry.naturalAmount =
                            convertTokenLamportsToNatural(
                                maybeToken,
                                newAmount,
                            ).toString();
                        inputTokenEntry.amount = newAmount;
                    }
                }
            }),
        ),
    removeInputToken: (token: string) =>
        set((state) => ({
            inputTokens: state.inputTokens.filter(
                (t) => t.tokenAddress !== token,
            ),
        })),
    clearInputTokens: () => set(() => ({ inputTokens: [] })),
    outputToken: TOKEN_MINT,
    setOutputToken: (newToken: string) =>
        set(
            produce((state: Store) => {
                if (state.outputToken === newToken) {
                    return;
                }

                // Clear all routes since the output token has changed.
                for (const inputToken of state.inputTokens) {
                    inputToken.route = undefined;
                }

                state.outputToken = newToken;
            }),
        ),
    setRoute: (
        inputToken: string,
        outputToken: string,
        amount: number,
        timeStamp: number,
        jupiterQuote?: QuoteResponse,
    ) =>
        set(
            produce((state: Store) => {
                if (state.outputToken != outputToken) {
                    return;
                }

                const inputTokenEntry = state.inputTokens.find(
                    (t) => t.tokenAddress === inputToken,
                );
                if (!inputTokenEntry || inputTokenEntry.amount != amount) {
                    return;
                }

                const maybeOldSwapRoute = inputTokenEntry?.route;
                if (
                    maybeOldSwapRoute &&
                    maybeOldSwapRoute.timeStamp > timeStamp
                ) {
                    return;
                }

                inputTokenEntry.status = "ROUTING";
                inputTokenEntry.route = {
                    timeStamp: timeStamp,
                    jupiterQuote: jupiterQuote,
                };
            }),
        ),
    setRouteStatus: (inputToken, status) =>
        set(
            produce((state: Store) => {
                const inputTokenEntry = state.inputTokens.find(
                    (t) => t.tokenAddress === inputToken,
                );
                if (!inputTokenEntry) {
                    return;
                }

                inputTokenEntry.status = status;
            }),
        ),
    fetchAllRoutes: () => {
        const timeStamp = Date.now();
        const state = get();

        for (const inputTokenEntry of state.inputTokens) {
            if (inputTokenEntry.amount <= 0) {
                state.setRouteStatus(
                    inputTokenEntry.tokenAddress,
                    "AMOUNT_TOO_SMALL",
                );
                continue;
            }

            if (inputTokenEntry.tokenAddress == state.outputToken) {
                state.setRouteStatus(
                    inputTokenEntry.tokenAddress,
                    "SAME_INPUT_OUTPUT",
                );
                continue;
            }

            const maybeRoute = inputTokenEntry.route;
            if (
                maybeRoute &&
                timeStamp - maybeRoute.timeStamp <
                    MIN_JUPITER_ROUTE_REFETCH_INTERVAL
            ) {
                continue;
            }

            // When we get to this point we know that no outstanding jupiter request, for these inputs,
            // is in flight, we know that because we set the timestamp before, and clear it if the inputs change.

            // Update the status since we are fetching again.
            state.setRoute(
                inputTokenEntry.tokenAddress,
                state.outputToken,
                inputTokenEntry.amount,
                timeStamp,
                undefined,
            );

            console.log(`Fetching quote for ${inputTokenEntry.tokenAddress}`);

            JUPITER_API.quoteGet({
                inputMint: inputTokenEntry.tokenAddress,
                outputMint: state.outputToken,
                amount: inputTokenEntry.amount,
                maxAccounts: 64 - RESERVED_FEE_ACCOUNTS,
            })
                .then((quote) => {
                    get().setRoute(
                        inputTokenEntry.tokenAddress,
                        state.outputToken,
                        inputTokenEntry.amount,
                        timeStamp,
                        quote,
                    );
                })
                .catch((error) => {
                    console.warn(error);

                    const response = error.response;
                    if (!response || response?.status != 400) {
                        get().setRouteStatus(
                            inputTokenEntry.tokenAddress,
                            "JUPITER_UNKOWN",
                        );
                        return;
                    }

                    const errorCode = response.body.errorCode;
                    if (errorCode === "COULD_NOT_FIND_ANY_ROUTE") {
                        get().setRouteStatus(
                            inputTokenEntry.tokenAddress,
                            "NO_ROUTE",
                        );
                        return;
                    }

                    get().setRouteStatus(
                        inputTokenEntry.tokenAddress,
                        "JUPITER_UNKOWN",
                    );
                });
        }
    },
    swapIntents: [],
    swapAllRoutes: () =>
        set((state) => {
            const transactions = [];
            let outAmount = 0;
            for (const inputTokenEntry of state.inputTokens) {
                if (!inputTokenEntry.route?.jupiterQuote) {
                    continue;
                }
            }

            return {
                swapIntents: [
                    {
                        timeStamp: Date.now(),
                        outputToken: state.outputToken,
                        outAmount: outAmount,
                    },
                    ...state.swapIntents,
                ],
            };
        }),
});

/*

export type SwapIntent = {
    timeStamp: number;
    outputToken: string;
    outAmount: number;
    transactions: {
        inputTokenAddress: string;
        inAmount: number;
        transaction: Transaction;
        status: TransactionStatus;
    }[];
};
*/

type Store = CacheSlice & GlobalSettings & SwapSlice;

const useStore = createWithEqualityFn<
    Store,
    [
        ["zustand/subscribeWithSelector", never],
        ["zustand/persist", PersistedGlobalSettings],
    ]
>(
    subscribeWithSelector(
        persist(
            (...a) => ({
                ...createCacheSlice(...a),
                ...createGlobalSettingsSlice(...a),
                ...createSwapSlice(...a),
            }),
            {
                name: "global-settings-store",
                partialize: (state) => ({
                    maxSlippageBps: state.maxSlippageBps,
                    allowUntrustedTokens: state.allowUntrustedTokens,
                }),
            },
        ),
    ),
    shallow,
);

// Subscribers

useStore.subscribe(
    (state) => [
        state.tokenList,
        state.heliusTokenList,
        state.allowUntrustedTokens,
    ],
    () => {
        useStore.getState().updateCachedFilteredTokenList();
        console.log("Token list updated");
    },
    { equalityFn: shallow },
);

useStore.subscribe(
    (state) =>
        [state.inputTokens, state.outputToken] as [InputTokenEntry[], string],
    () => useStore.getState().fetchAllRoutes(),
    {
        equalityFn: (a, b) =>
            a[1] === b[1] &&
            selectiveArrayShallow(a[0], b[0], {
                route: true,
                swap: true,
                status: true,
            }),
    },
);

// Update Loops

setInterval(() => useStore.getState().fetchAllRoutes(), SWAP_REFRESH_INTERVAL);

export default useStore;
