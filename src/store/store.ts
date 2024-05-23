import { Token } from "@/lib/jupyter";
import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";

export interface CacheSlice {
    strictTokenList: Token[] | null;
    otherTokenList: Token[] | null;
    setTokenLists: (strictTokenList: Token[], otherTokenList: Token[]) => void;
}

const createCacheSlice: StateCreator<Store, [], [], CacheSlice> = (set) => ({
    strictTokenList: null,
    otherTokenList: null,
    setTokenLists: (strictTokenList: Token[], otherTokenList: Token[]) =>
        set(() => ({
            strictTokenList: strictTokenList,
            otherTokenList: otherTokenList,
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
    outputToken: string | null;
}

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set) => ({
    inputTokens: [],
    addInputToken: (newToken: string) =>
        set((state) => ({ inputTokens: [...state.inputTokens, newToken] })),
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
