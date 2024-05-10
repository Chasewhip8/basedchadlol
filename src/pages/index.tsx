import {Inter} from "next/font/google";
import {cn} from "@/lib/utils";
import Placer from "@/components/placer/Placer";
import {Button} from "@/components/ui/button";
import {TwitterIcon, Clipboard, ClipboardCheckIcon} from "lucide-react";
import {Card} from "@/components/ui/card";
import Image from "next/image";
import {useState} from "react";
import Link from "next/link";

const inter = Inter({subsets: ["latin"]});
const address = "E7eq75v6muvR7KSoc3ayWCukBcdDtCauvAq1DWKsqhPV";

export default function Home() {
    const [copied, setCopied] = useState(false);
    return (
        <main className={cn("flex flex-col gap-y-4 items-center", inter.className)}>
            <div className="fixed bottom-0 -z-10 mt-[130px] h-[824px] overflow-hidden">
                <Image src="/chad.png" alt="chad" width={1024} height={1200} priority/>
            </div>

            <Card className="text-6xl font-bold my-[100px] p-6">
                Based Solana Chad $BSC
            </Card>

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

            <div className="flex gap-4 mb-10">
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

            <Placer/>
        </main>
    );
}
