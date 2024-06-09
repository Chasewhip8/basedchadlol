import { toast } from "@/components/ui/use-toast";
import {
    FEE_LAMPORTS,
    FEE_WALLET,
    MIN_JUPITER_ROUTE_REFETCH_INTERVAL,
    RESERVED_FEE_ACCOUNTS,
    SWAP_REFRESH_INTERVAL,
    TOKEN_DUST_MAX_VALUE,
    TOKEN_MINT,
    VALUE_IN_MIN_FOR_FEE_USD,
} from "@/lib/config";
import {
    getAddressLookupTableAccounts,
    getPriorityFeeEstimate,
    sendHeliusTransaction,
} from "@/lib/helius/api";
import { JUPITER_API, deserializeInstruction } from "@/lib/jupiter";
import { selectiveArrayShallow } from "@/lib/selectiveShallow";
import { CONNECTION } from "@/lib/solana";
import {
    BSC_TOKEN,
    SOL_TOKEN,
    Token,
    TokenList,
    WRAPPED_SOL_MINT,
    convertTokenLamportsToNatural,
    convertTokenNaturalToLamports,
} from "@/lib/token";
import { getUniqueId } from "@/lib/utils";
import { QuoteResponse, SwapInstructionsResponse } from "@jup-ag/api";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
    ComputeBudgetInstruction,
    ComputeBudgetProgram,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    TransactionMessage,
    TransactionSignature,
    VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import { produce } from "immer";
import { StateCreator } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export interface CacheSlice {
    wallet?: WalletContextState;
    setWallet: (wallet: WalletContextState) => void;
    tokenList: Token[] | null;
    setTokenList: (list: Token[]) => void;
    heliusTokenList: Token[] | null;
    setHeliusTokenList: (list: Token[]) => void;
    cachedFilteredTokenList: TokenList | null;
    updateCachedFilteredTokenList: () => void;
}

const createCacheSlice: StateCreator<Store, [], [], CacheSlice> = (set) => ({
    wallet: undefined,
    setWallet: (wallet: WalletContextState) =>
        set((state) => {
            if (state.wallet && state.wallet.publicKey != wallet.publicKey) {
                // Clear the cached token list when the wallet changes.
                return {
                    wallet: wallet,
                    heliusTokenList: null,
                    cachedFilteredTokenList: null,
                };
            } else {
                return {
                    wallet: wallet,
                };
            }
        }),
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
                    if (cachedList.hasOwnProperty(token.address)) {
                        const tags = cachedList[token.address].tags;
                        for (const tag of token.tags) {
                            if (!tags.includes(tag)) {
                                tags.push(tag);
                            }
                        }
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
    autoSlippage: boolean;
    maxAutoSlippageBps: number;
    maxSlippageBps: number;
}

export interface GlobalSettings extends PersistedGlobalSettings {
    setAutoSlippage: (autoSlippage: boolean) => void;
    setMaxAutoSlippageBps: (maxAutoSlippageBps: number) => void;
    setMaxSlippageBps: (maxSlippageBps: number) => void;
}

const createGlobalSettingsSlice: StateCreator<Store, [], [], GlobalSettings> = (
    set,
) => ({
    autoSlippage: true,
    setAutoSlippage: (autoSlippage: boolean) =>
        set(() => ({
            autoSlippage: autoSlippage,
        })),
    maxAutoSlippageBps: 300,
    setMaxAutoSlippageBps: (maxAutoSlippageBps: number) =>
        set(() => ({
            maxAutoSlippageBps: maxAutoSlippageBps,
        })),
    maxSlippageBps: 100,
    setMaxSlippageBps: (maxSlippageBps: number) =>
        set(() => ({
            maxSlippageBps: maxSlippageBps,
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

type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED";

export type SwapTransactionInfo = {
    inputTokenAddress: string;
    inAmount: number;
    swapInstructions?: SwapInstructionsResponse;
    status: TransactionStatus;
    transactionSignature?: string;
};

type SwapIntentStatus =
    | "SWAPPING"
    | "PROCESSING"
    | "SENT"
    | "COMPLETED"
    | "TRANSACTIONS_CREATE_FAILED";

export type SwapIntent = {
    intentId: number;
    userAddress: string;
    timeStamp: number;
    outputToken: string;
    outAmount: number;
    transactions: SwapTransactionInfo[];
    status: SwapIntentStatus;
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
    setSwapIntentInstructions: (
        intentId: number,
        inputToken: string,
        swapInstructions: SwapInstructionsResponse,
    ) => void;
    swapAllRoutes: (userAddress: string) => void;
    setSwapTransactionIntentStatus: (
        intentId: number,
        inputToken: string,
        status: TransactionStatus,
    ) => void;
    setSwapTransactionIntentStatusTxId: (
        intentId: number,
        txId: string,
        status: TransactionStatus,
    ) => void;
    setSwapIntentStatus: (intentId: number, status: SwapIntentStatus) => void;
    setSwapTransactionIntentSignatures: (
        intentId: number,
        signatures: TransactionSignature[],
    ) => void;
    processSwapIntents: () => void;
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
                if (newTokens.length >= 20) {
                    toast({
                        title: "Add Dust: Too many tokens",
                        description:
                            "There are too many dust tokens to swap in one action, 20 have been added.",
                    });
                    break;
                }

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
                autoSlippage: state.autoSlippage,
                maxAutoSlippageBps: state.maxAutoSlippageBps,
                slippageBps: state.autoSlippage
                    ? undefined
                    : state.maxSlippageBps,
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
    setSwapIntentInstructions: (
        intentId: number,
        inputToken: string,
        swapInstructions: SwapInstructionsResponse,
    ) =>
        set(
            produce((state: Store) => {
                const swapIntent = state.swapIntents.find(
                    (intent) => intent.intentId === intentId,
                );
                if (!swapIntent) {
                    return;
                }

                const transactionInfo = swapIntent.transactions.find(
                    (info) => info.inputTokenAddress == inputToken,
                );
                if (!transactionInfo) {
                    return;
                }

                transactionInfo.swapInstructions = swapInstructions;
            }),
        ),
    swapAllRoutes: (userAddress: string) =>
        set((state) => {
            if (!state.wallet || !state.wallet.connected) {
                return state;
            }

            const intentId = getUniqueId();
            const transactions: SwapTransactionInfo[] = [];
            let outAmount = 0;
            for (const inputTokenEntry of state.inputTokens) {
                if (!inputTokenEntry.route?.jupiterQuote) {
                    continue;
                }

                outAmount += Number(
                    inputTokenEntry.route.jupiterQuote.outAmount,
                );

                transactions.push({
                    inputTokenAddress: inputTokenEntry.tokenAddress,
                    inAmount: inputTokenEntry.amount,
                    swapInstructions: undefined,
                    status: "PENDING",
                });

                JUPITER_API.swapInstructionsPost({
                    swapRequest: {
                        userPublicKey: userAddress,
                        wrapAndUnwrapSol: true,
                        useSharedAccounts: true,
                        dynamicComputeUnitLimit: true,
                        quoteResponse: inputTokenEntry.route.jupiterQuote,
                    },
                })
                    .then((response) => {
                        get().setSwapIntentInstructions(
                            intentId,
                            inputTokenEntry.tokenAddress,
                            response,
                        );
                    })
                    .catch((error) => {
                        console.warn(error);

                        get().setSwapIntentStatus(
                            intentId,
                            "TRANSACTIONS_CREATE_FAILED",
                        );
                    });
            }

            return {
                swapIntents: [
                    {
                        intentId: intentId,
                        userAddress: userAddress,
                        timeStamp: Date.now(),
                        outputToken: state.outputToken,
                        outAmount: outAmount,
                        transactions: transactions,
                        status: "SWAPPING",
                    },
                    ...state.swapIntents,
                ],
            };
        }),
    setSwapTransactionIntentStatus: (
        intentId: number,
        inputToken: string,
        status: TransactionStatus,
    ) =>
        set(
            produce((state: Store) => {
                const swapIntent = state.swapIntents.find(
                    (t) => t.intentId === intentId,
                );
                if (!swapIntent) {
                    return;
                }

                const transactionInfo = swapIntent.transactions.find(
                    (t) => t.inputTokenAddress === inputToken,
                );
                if (!transactionInfo) {
                    return;
                }

                transactionInfo.status = status;
            }),
        ),
    setSwapTransactionIntentStatusTxId: (
        intentId: number,
        txId: string,
        status: TransactionStatus,
    ) =>
        set(
            produce((state: Store) => {
                const swapIntent = state.swapIntents.find(
                    (t) => t.intentId === intentId,
                );
                if (!swapIntent) {
                    return;
                }

                const transactionInfo = swapIntent.transactions.find(
                    (t) => t.transactionSignature === txId,
                );
                if (!transactionInfo) {
                    return;
                }

                transactionInfo.status = status;
            }),
        ),
    setSwapIntentStatus: (intentId: number, status: SwapIntentStatus) =>
        set(
            produce((state: Store) => {
                const swapIntent = state.swapIntents.find(
                    (t) => t.intentId === intentId,
                );
                if (!swapIntent) {
                    return;
                }

                swapIntent.status = status;
            }),
        ),
    setSwapTransactionIntentSignatures: (
        intentId: number,
        signatures: TransactionSignature[],
    ) =>
        set(
            produce((state: Store) => {
                const swapIntent = state.swapIntents.find(
                    (t) => t.intentId === intentId,
                );
                if (!swapIntent) {
                    return;
                }

                if (signatures.length != swapIntent.transactions.length) {
                    console.warn(
                        "store::swap::setSwapTransactionIntentSignatures::WARN_SIGNATURES_LENGTH_MISMATCH",
                    );
                    return;
                }

                for (let i = 0; i < signatures.length; i++) {
                    swapIntent.transactions[i].transactionSignature =
                        signatures[i];
                }
                swapIntent.status = "SENT";
            }),
        ),
    processSwapIntents: () => {
        const state = get();

        for (const swapIntent of state.swapIntents) {
            if (swapIntent.status != "SWAPPING") {
                continue;
            }

            const allTransactionsPresent =
                swapIntent.transactions.length > 0 &&
                swapIntent.transactions.every(
                    (transaction) =>
                        transaction.swapInstructions &&
                        transaction.status === "PENDING",
                );
            if (!allTransactionsPresent) {
                continue;
            }

            // Ensure we do not have multiple listeners for the same intent
            state.setSwapIntentStatus(swapIntent.intentId, "PROCESSING");

            toast({
                title: "Swap: Processing Swap",
                description:
                    "Processing and assembling swap transactions. Please wait.",
            });

            // Process, sign, and send transaction.
            (async () => {
                const priorityFee = (await getPriorityFeeEstimate()).result
                    .priorityFeeEstimate;

                const addressLookupTableAddresses =
                    swapIntent.transactions.flatMap(
                        (transactionInfo) =>
                            transactionInfo.swapInstructions
                                ?.addressLookupTableAddresses,
                    ) as string[];

                const addressLookupTableAccounts =
                    await getAddressLookupTableAccounts(
                        addressLookupTableAddresses,
                    );

                const blockhash = (await CONNECTION.getLatestBlockhash())
                    .blockhash;

                const transactions: VersionedTransaction[] = [];

                for (const transactionInfo of swapIntent.transactions) {
                    const swapInstructions = transactionInfo.swapInstructions;
                    if (!swapInstructions) {
                        return;
                    }

                    const computeLimit =
                        ComputeBudgetInstruction.decodeSetComputeUnitLimit(
                            deserializeInstruction(
                                swapInstructions.computeBudgetInstructions[0],
                            ),
                        ).units + 1000;

                    const correctedComputeUnitPrice = Math.max(
                        priorityFee,
                        Math.ceil((10001 / computeLimit) * 1000000), // This is the min compute price for helius fast lane
                    );

                    const instructions: TransactionInstruction[] = [
                        ComputeBudgetProgram.setComputeUnitLimit({
                            units: computeLimit,
                        }),
                        ComputeBudgetProgram.setComputeUnitPrice({
                            microLamports: correctedComputeUnitPrice,
                        }),
                        ...swapInstructions.setupInstructions.map(
                            deserializeInstruction,
                        ),
                        deserializeInstruction(
                            swapInstructions.swapInstruction,
                        ),
                    ];

                    if (swapInstructions.cleanupInstruction) {
                        instructions.push(
                            deserializeInstruction(
                                swapInstructions.cleanupInstruction,
                            ),
                        );
                    }

                    const payer = new PublicKey(swapIntent.userAddress);

                    // Check value of swap
                    const maybeInputToken =
                        state.cachedFilteredTokenList &&
                        state.cachedFilteredTokenList[
                            transactionInfo.inputTokenAddress
                        ];
                    if (
                        maybeInputToken &&
                        maybeInputToken.price &&
                        convertTokenLamportsToNatural(
                            maybeInputToken,
                            transactionInfo.inAmount,
                        ) *
                            maybeInputToken.price >=
                            VALUE_IN_MIN_FOR_FEE_USD
                    ) {
                        instructions.push(
                            SystemProgram.transfer({
                                fromPubkey: payer,
                                toPubkey: new PublicKey(FEE_WALLET),
                                lamports: FEE_LAMPORTS,
                            }),
                        );
                    }

                    const messageV0 = new TransactionMessage({
                        payerKey: new PublicKey(swapIntent.userAddress),
                        recentBlockhash: blockhash,
                        instructions: instructions,
                    }).compileToV0Message(addressLookupTableAccounts);
                    transactions.push(new VersionedTransaction(messageV0));
                }

                const wallet = get().wallet;
                if (
                    !wallet ||
                    !wallet.connected ||
                    !wallet.signAllTransactions
                ) {
                    return;
                }

                const signedTransactions = (
                    await wallet.signAllTransactions(transactions)
                ).map((tx) => ({
                    tx: tx,
                    txId: base58.encode(tx.signatures[0]),
                }));

                get().setSwapTransactionIntentSignatures(
                    swapIntent.intentId,
                    signedTransactions.map((t) => t.txId),
                );

                await sendHeliusTransaction(
                    signedTransactions,
                    (txId, confirmed) =>
                        get().setSwapTransactionIntentStatusTxId(
                            swapIntent.intentId,
                            txId,
                            confirmed ? "CONFIRMED" : "FAILED",
                        ),
                );

                toast({
                    title: "Swap: Executed Swap",
                    description:
                        "Swap transactions have been sent and confirmed.",
                });

                get().setSwapIntentStatus(swapIntent.intentId, "COMPLETED");
            })().catch((error) => {
                console.warn(error);

                toast({
                    variant: "destructive",
                    title: "Swap: Error Processing Swap",
                    description:
                        "There was an error assembling and sending the swap transactions. Please try again.",
                });

                get().setSwapIntentStatus(
                    swapIntent.intentId,
                    "TRANSACTIONS_CREATE_FAILED",
                );
            });
        }
    },
});

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
                    autoSlippage: state.autoSlippage,
                    maxSlippageBps: state.maxSlippageBps,
                    maxAutoSlippageBps: state.maxAutoSlippageBps,
                }),
            },
        ),
    ),
    shallow,
);

// Subscribers

useStore.subscribe(
    (state) => [state.tokenList, state.heliusTokenList],
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

useStore.subscribe(
    (state) => [state.swapIntents],
    () => useStore.getState().processSwapIntents(),
    {
        equalityFn: (a, b) =>
            selectiveArrayShallow(a[0], b[0], {
                status: true,
            }),
    },
);

useStore.subscribe(
    (state) => [state.swapIntents],
    (state) => {
        console.log(state);
    },
);

// Update Loops

setInterval(() => useStore.getState().fetchAllRoutes(), SWAP_REFRESH_INTERVAL);

export default useStore;
