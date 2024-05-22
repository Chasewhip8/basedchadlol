import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";

export interface CacheSlice {}

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
        (set, get, api) => ({
            ...createGlobalSettingsSlice(set, get, api),
            ...createSwapSlice(set, get, api),
        }),
        {
            name: "global-settings-store",
            partialize: (state) => ({ maxSlippageBps: state.maxSlippageBps }),
        },
    ),
);

export default useStore;
