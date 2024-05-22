import Placer from "@/components/placer/Placer";
import { Button } from "@/components/ui/button";
import {
    TwitterIcon,
    Clipboard,
    ClipboardCheckIcon,
    ExternalLinkIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { ReactElement, useEffect, useState } from "react";
import Link from "next/link";
import { TwitterShareButton } from "react-share";
import DefaultLayout from "@/components/DefaultLayout";
import { NextPageWithLayout } from "./_app";

const address = "E7eq75v6muvR7KSoc3ayWCukBcdDtCauvAq1DWKsqhPV";

const Home: NextPageWithLayout = () => {
    const [copied, setCopied] = useState(false);

    // Fix hydration error in react-share
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex flex-col gap-y-12 mt-20 mx-2 items-center">
            <div className="fixed bottom-0 -z-10 overflow-hidden w-max">
                <Image
                    className="w-auto"
                    src="/chad.png"
                    alt="chad"
                    height={792}
                    width={776}
                    priority
                />
            </div>

            <span className="text-7xl font-bold gradient-text text-center">
                Based Solana Chad
            </span>

            <div className="flex flex-col gap-4 items-center">
                <Card
                    className="flex flex-row gap-x-4 p-4 cursor-pointer items-center"
                    onClick={() => {
                        navigator.clipboard.writeText(address);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2 * 1000);
                    }}
                >
                    <span className="break-all">{address}</span>
                    {copied ? <ClipboardCheckIcon /> : <Clipboard />}
                </Card>

                <div className="flex gap-x-4 gap-y-2 flex-wrap justify-center">
                    <Link
                        href="https://twitter.com/basedsolanachad"
                        target="_blank"
                    >
                        <Button
                            variant="secondary"
                            size="lg"
                            className="gap-x-2"
                        >
                            <TwitterIcon />
                            Twitter
                        </Button>
                    </Link>
                    <Link href="https://t.me/+Em8tFPKz6k05M2Qx" target="_blank">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="gap-x-2"
                        >
                            <Image
                                className="-ml-4 -mr-3 w-14"
                                src="/telegram.svg"
                                alt="telegram logo"
                                width={48}
                                height={48}
                            />
                            Telegram
                        </Button>
                    </Link>
                    <Link
                        href="https://birdeye.so/token/E7eq75v6muvR7KSoc3ayWCukBcdDtCauvAq1DWKsqhPV?chain=solana"
                        target="_blank"
                    >
                        <Button
                            size="lg"
                            variant="secondary"
                            className="gap-x-2"
                        >
                            <Image
                                className="pr-1"
                                src="/birdeye.png"
                                alt="telegram logo"
                                width={32}
                                height={24}
                            />
                            Birdeye
                        </Button>
                    </Link>
                </div>
                {/*
                {mounted && (
                    <TwitterShareButton
                        url="https://basedchad.lol/"
                        title="I'm based"
                    >
                        <Button className="flex gap-x-3 items-center justify-center bg-no-repeat bg-gradient-to-br from-solana-green to-solana-purple font-semibold">
                            Share on Twitter
                            <ExternalLinkIcon />
                        </Button>
                    </TwitterShareButton>
                )} */}
            </div>

            <div className="mt-12 max-w-full">
                <Placer />
            </div>
        </div>
    );
};

Home.getLayout = function getLayout(page: ReactElement) {
    return <DefaultLayout>{page}</DefaultLayout>;
};

export default Home;
