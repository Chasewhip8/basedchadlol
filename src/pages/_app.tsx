import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";

import SolanaWalletProvider from "@/components/providers/SolanaWalletProvider";
import { ThemeProvider } from "next-themes";

import "@solana/wallet-adapter-react-ui/styles.css";
import "@/styles/globals.css";
import QueryProvider from "@/components/providers/QueryProvider";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout;
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
    // Use the layout defined at the page level, if available
    const getLayout = Component.getLayout ?? ((page) => page);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
        >
            <QueryProvider>
                <SolanaWalletProvider>
                    {mounted && getLayout(<Component {...pageProps} />)}
                </SolanaWalletProvider>
            </QueryProvider>
        </ThemeProvider>
    );
}
