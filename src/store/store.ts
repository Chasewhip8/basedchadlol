import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";

export interface CacheSlice {}

export interface PersistedGlobalSettings {
    maxSlippageBps: number;
}

export interface GlobalSettings extends PersistedGlobalSettings {
    setMaxSlippageBps: (maxSlippageBps: number) => void;
}

export interface SwapSlice {
    inputTokens: string[];
    addInputTokens: (newTokens: string[]) => void;
    outputToken: string | null;
}

type Store = CacheSlice & GlobalSettings & SwapSlice;

const createGlobalSettingsSlice: StateCreator<Store, [], [], GlobalSettings> = (
    set,
) => ({
    maxSlippageBps: 50,
    setMaxSlippageBps: (maxSlippageBps: number) =>
        set(() => ({
            maxSlippageBps: maxSlippageBps,
        })),
});

const createSwapSlice: StateCreator<Store, [], [], SwapSlice> = (set) => ({
    inputTokens: [],
    addInputTokens: (newTokens: string[]) =>
        set((state) => ({ inputTokens: [...state.inputTokens, ...newTokens] })),
    outputToken: null,
});

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
