import { MIN_JUPITER_ROUTE_REFETCH_INTERVAL, TOKEN_MINT } from "@/lib/config";
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
import { StateCreator, create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { produce } from "immer";
import { JUPITER_API } from "@/lib/jupiter";
import { QuoteResponse } from "@jup-ag/api";
import {
    selectiveArrayShallow,
    selectiveShallow,
} from "@/lib/selectiveShallow";

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

export type SwapStatus =
    | "NO_ROUTE"
    | "JUPITER_UNKOWN"
    | "SAME_INPUT_OUTPUT"
    | "AMOUNT_TOO_SMALL";

export interface InputTokenEntry {
    tokenAddress: string;
    naturalAmount: string;
    amount: number; // Optimization to prevent the need to fetch on tokenList change. Duplicate state but allowed.
    route?: {
        timeStamp: number;
        jupiterQuote: QuoteResponse;
    };
    status?: SwapStatus[];
}

export interface SwapSlice {
    inputTokens: InputTokenEntry[];
    addInputToken: (newToken: string) => void;
    setInputTokensPercentageAmount: (percentage: number) => void;
    removeInputToken: (token: string) => void;
    clearInputTokens: () => void;
    outputToken: string;
    setOutputToken: (newToken: string) => void;
    setInputTokenAmount: (tokenAddress: string, naturalAmount: string) => void;
    setSwapRoute: (
        inputToken: string,
        outputToken: string,
        amount: number,
        timeStamp: number,
        jupiterQuote: QuoteResponse,
    ) => void;
    addSwapError: (
        inputToken: string,
        errors: NonNullable<InputTokenEntry["status"]>,
    ) => void;
    clearSwapErrorsAndRoute: (inputToken: string) => void;
}

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set) => ({
    inputTokens: [
        { tokenAddress: WRAPPED_SOL_MINT, naturalAmount: "0", amount: 0 },
    ],
    addInputToken: (newToken: string) =>
        set((state) => {
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
                    },
                ],
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

                inputTokenEntry.naturalAmount = naturalAmount;
                inputTokenEntry.amount = convertTokenNaturalToLamports(
                    token,
                    naturalAmount,
                );
            }),
        ),
    setInputTokensPercentageAmount: (percentage: number) =>
        set(
            produce((state: Store) => {
                for (const token of state.inputTokens) {
                    const maybeToken =
                        state.cachedFilteredTokenList &&
                        state.cachedFilteredTokenList[token.tokenAddress];

                    if (maybeToken?.balance) {
                        const newAmount = maybeToken.balance * percentage;
                        token.naturalAmount = convertTokenLamportsToNatural(
                            maybeToken,
                            newAmount,
                        ).toString();
                        token.amount = newAmount;
                    }
                }
            }),
        ),
    setSwapRoute: (
        inputToken: string,
        outputToken: string,
        amount: number,
        timeStamp: number,
        jupiterQuote: QuoteResponse,
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

                inputTokenEntry.route = {
                    timeStamp: timeStamp,
                    jupiterQuote: jupiterQuote,
                };
                inputTokenEntry.status = undefined;
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

                for (const inputToken of state.inputTokens) {
                    inputToken.route = undefined;
                }

                state.outputToken = newToken;
            }),
        ),
    addSwapError: (inputToken, errors) =>
        set(
            produce((state: Store) => {
                const inputTokenEntry = state.inputTokens.find(
                    (t) => t.tokenAddress === inputToken,
                );
                if (!inputTokenEntry) {
                    return;
                }

                if (inputTokenEntry.status) {
                    inputTokenEntry.status.push(...errors);
                } else {
                    inputTokenEntry.status = errors;
                }
                inputTokenEntry.route = undefined;
            }),
        ),
    clearSwapErrorsAndRoute: (inputToken) =>
        set(
            produce((state: Store) => {
                const inputTokenEntry = state.inputTokens.find(
                    (t) => t.tokenAddress === inputToken,
                );
                if (!inputTokenEntry) {
                    return;
                }

                inputTokenEntry.status = undefined;
                inputTokenEntry.route = undefined;
            }),
        ),
});

type Store = CacheSlice & GlobalSettings & SwapSlice;

const useStore = create<
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
    ([updatedInputTokens, updatedOutputToken]) => {
        const timeStamp = Date.now();
        const state = useStore.getState();

        for (const inputTokenEntry of updatedInputTokens) {
            if (inputTokenEntry.amount <= 0) {
                state.clearSwapErrorsAndRoute(inputTokenEntry.tokenAddress);
                continue;
            }

            if (inputTokenEntry.tokenAddress == updatedOutputToken) {
                state.addSwapError(inputTokenEntry.tokenAddress, [
                    "SAME_INPUT_OUTPUT",
                ]);
                continue;
            }

            const maybeRoute = inputTokenEntry.route;
            if (
                maybeRoute &&
                timeStamp - maybeRoute.timeStamp <
                    MIN_JUPITER_ROUTE_REFETCH_INTERVAL &&
                inputTokenEntry.amount ===
                    Number(maybeRoute.jupiterQuote.inAmount)
            ) {
                continue;
            }

            // Clear the swap route since it is being refreshed.
            state.clearSwapErrorsAndRoute(inputTokenEntry.tokenAddress);

            console.log(`Fetching quote for ${inputTokenEntry.tokenAddress}`);

            JUPITER_API.quoteGet({
                inputMint: inputTokenEntry.tokenAddress,
                outputMint: updatedOutputToken,
                amount: inputTokenEntry.amount,
            })
                .then((quote) => {
                    state.setSwapRoute(
                        inputTokenEntry.tokenAddress,
                        updatedOutputToken,
                        inputTokenEntry.amount,
                        timeStamp,
                        quote,
                    );
                })
                .catch((error) => {
                    console.warn(error);

                    const response = error.response;
                    if (!response || response?.status != 400) {
                        state.addSwapError(inputTokenEntry.tokenAddress, [
                            "JUPITER_UNKOWN",
                        ]);
                        return;
                    }

                    const errorCode = response.body.errorCode;
                    if (errorCode === "COULD_NOT_FIND_ANY_ROUTE") {
                        state.addSwapError(inputTokenEntry.tokenAddress, [
                            "NO_ROUTE",
                        ]);
                        return;
                    }

                    state.addSwapError(inputTokenEntry.tokenAddress, [
                        "JUPITER_UNKOWN",
                    ]);
                });
        }
    },
    {
        equalityFn: (a, b) =>
            a[1] === b[1] &&
            selectiveArrayShallow(a[0], b[0], { route: true, status: true }),
    },
);

export default useStore;
