import { Token, TokenInfoList, TokenList } from "@/lib/token";
import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";

export interface CacheSlice {
    tokenList: TokenList | null;
    setTokenList: (list: TokenList) => void;
    tokenInfoList: TokenInfoList | null;
    setTokenInfoList: (list: TokenInfoList) => void;
}

const createCacheSlice: StateCreator<Store, [], [], CacheSlice> = (set) => ({
    tokenList: null,
    setTokenList: (list: TokenList) =>
        set(() => ({
            tokenList: list,
        })),
    tokenInfoList: null,
    setTokenInfoList: (list: TokenInfoList) =>
        set(() => ({
            tokenInfoList: list,
        })),
});

export interface PersistedGlobalSettings {
    maxSlippageBps: number;
}

export interface GlobalSettings extends PersistedGlobalSettings {
    setMaxSlippageBps: (maxSlippageBps: number) => void;
}

const createGlobalSettingsSlice: StateCreator<Store, [], [], GlobalSettings> = (
    set,
) => ({
    maxSlippageBps: 50,
    setMaxSlippageBps: (maxSlippageBps: number) =>
        set(() => ({
            maxSlippageBps: maxSlippageBps,
        })),
});

export interface SwapSlice {
    inputTokens: string[];
    addInputToken: (newToken: string) => void;
    removeInputToken: (token: string) => void;
    clearInputTokens: (newToken: string) => void;
    outputToken: string | null;
}

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set) => ({
    inputTokens: [],
    addInputToken: (newToken: string) =>
        set((state) => ({ inputTokens: [...state.inputTokens, newToken] })),
    addInputToken: (token: string) =>
        set((state) => ({
            inputTokens: state.inputTokens.filter((t) => t !== token),
        })),
    outputToken: null,
});

type Store = CacheSlice & GlobalSettings & SwapSlice;

const useStore = create<Store, [["zustand/persist", PersistedGlobalSettings]]>(
    persist(
        (...a) => ({
            ...createCacheSlice(...a),
            ...createGlobalSettingsSlice(...a),
            ...createSwapSlice(...a),
        }),
        {
            name: "global-settings-store",
            partialize: (state) => ({ maxSlippageBps: state.maxSlippageBps }),
        },
    ),
);

export default useStore;
