import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="description" content="Based Solana Chads" />
                <link rel="icon" href="/favicon.ico" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:creator" content="@basedsolanachad" />
                <meta property="og:url" content="https://basedchad.lol/" />
                <meta property="og:title" content="Based Solana Chads" />
                <meta
                    property="og:description"
                    content="A coin strictly for based Solana Chads, everyone else can cope seethe and fuck off to cry in a corner. Chads rule."
                />
                <meta
                    property="og:image"
                    content="https://basedchad.lol/embed.png"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
