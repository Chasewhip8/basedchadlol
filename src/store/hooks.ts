import useStore from "./store";

export function useToken(address: string) {
    const tokenList = useStore((state) => state.cachedFilteredTokenList);

    if (!tokenList) {
        throw Error("store::hooks::useToken::TOKEN_LIST_NOT_LOADED");
    }

    return tokenList[address];
}
