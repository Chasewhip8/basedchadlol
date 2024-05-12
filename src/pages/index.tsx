import {Inter} from "next/font/google";
import {cn} from "@/lib/utils";
import Placer from "@/components/placer/Placer";
import {Button} from "@/components/ui/button";
import {TwitterIcon, Clipboard, ClipboardCheckIcon, ExternalLinkIcon} from "lucide-react";
import {Card} from "@/components/ui/card";
import Image from "next/image";
import {useState} from "react";
import Link from "next/link";
import {TwitterShareButton} from "react-share";

const inter = Inter({subsets: ["latin"]});
const address = "E7eq75v6muvR7KSoc3ayWCukBcdDtCauvAq1DWKsqhPV";

export default function Home() {
    const [copied, setCopied] = useState(false);
    return (
        <main className={cn("flex flex-col gap-y-12 mt-20 mx-2 items-center", inter.className)}>
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

            <Card className="text-6xl text-center font-bold p-6">
                Based Solana Chad $BSC
            </Card>

            <div className="flex flex-col gap-4 items-center">
                <Card
                    className="flex flex-row gap-x-4 bg-black p-4 cursor-pointer items-center"
                    onClick={() => {
                        navigator.clipboard.writeText(address);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2 * 1000);
                    }}
                >
                    <span className="break-all">{address}</span>
                    {copied ? <ClipboardCheckIcon/> : <Clipboard/>}
                </Card>

                <div className="flex gap-x-4 gap-y-2 flex-wrap justify-center">
                    <Link href="https://twitter.com/basedsolanachad" target="_blank">
                        <Button size="lg" className="gap-x-2">
                            <TwitterIcon/>
                            Twitter
                        </Button>
                    </Link>
                    <Link href="https://t.me/+Em8tFPKz6k05M2Qx" target="_blank">
                        <Button size="lg" className="gap-x-2">
                            <Image className="-ml-4 -mr-3 w-14" src="/telegram.svg" alt="telegram logo" width={48} height={48} />
                            Telegram
                        </Button>
                    </Link>
                    <Link href="https://pump.fun/E7eq75v6muvR7KSoc3ayWCukBcdDtCauvAq1DWKsqhPV" target="_blank">
                        <Button size="lg" className="gap-x-2">
                            <Image className="pr-1" src="/pump.webp" alt="telegram logo" width={24} height={24} />
                            Pump
                        </Button>
                    </Link>
                </div>

                <TwitterShareButton
                    url="https://basedchad.lol/"
                    title="I'm based"
                >
                    <Button className="flex gap-x-3 items-center justify-center bg-no-repeat bg-gradient-to-br from-solana-green to-solana-purple font-semibold">
                        Share on Twitter
                        <ExternalLinkIcon/>
                    </Button>
                </TwitterShareButton>
            </div>

            <div className="mt-16 max-w-full">
                <Placer/>
            </div>
        </main>
    );
}
