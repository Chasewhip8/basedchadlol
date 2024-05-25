import { TOKEN_MINT } from "@/lib/config";
import {
    BSC_TOKEN,
    SOL_TOKEN,
    Token,
    TokenList,
    WRAPPED_SOL_MINT,
    isStrictToken,
} from "@/lib/token";
import { StateCreator, create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { produce } from "immer";

export interface CacheSlice {
    nativeBalance: number;
    tokenList: Token[] | null;
    setTokenList: (list: Token[]) => void;
    heliusTokenList: Token[] | null;
    setHeliusTokenList: (list: Token[]) => void;
    cachedFilteredTokenList: TokenList | null;
    updateCachedFilteredTokenList: () => void;
}

const createCacheSlice: StateCreator<Store, [], [], CacheSlice> = (set) => ({
    nativeBalance: 0,
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

export interface SwapSlice {
    inputTokens: { tokenAddress: string; naturalAmount: number }[];
    addInputToken: (newToken: string) => void;
    setInputTokensPercentageAmount: (percentage: number) => void;
    removeInputToken: (token: string) => void;
    clearInputTokens: () => void;
    outputToken: string;
    setOutputToken: (newToken: string) => void;
}

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set) => ({
    inputTokens: [{ tokenAddress: WRAPPED_SOL_MINT, naturalAmount: 0 }],
    addInputToken: (newToken: string) =>
        set((state) => {
            const maybeToken =
                state.cachedFilteredTokenList &&
                state.cachedFilteredTokenList[newToken];
            return {
                inputTokens: [
                    ...state.inputTokens,
                    {
                        tokenAddress: newToken,
                        naturalAmount:
                            (maybeToken?.balance &&
                                maybeToken.balance /
                                    10 ** maybeToken.decimals) ||
                            0,
                    },
                ],
            };
        }),
    setInputTokensPercentageAmount: (percentage: number) =>
        set(
            produce((state: Store) => {
                for (const token of state.inputTokens) {
                    const maybeToken =
                        state.cachedFilteredTokenList &&
                        state.cachedFilteredTokenList[token.tokenAddress];
                    token.naturalAmount =
                        (maybeToken?.balance &&
                            (maybeToken.balance * percentage) /
                                10 ** maybeToken.decimals) ||
                        0;
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
        set((state) => ({
            outputToken: newToken,
        })),
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

export default useStore;
