import { FC } from "react";
import NavButton from "./NavButton";
import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const NavBar: FC = () => {
    return (
        <div className="flex flex-row gap-x-2 w-full py-4 px-6">
            <div className="flex flex-row overflow-x-auto items-center">
                <span className="hidden md:block rounded-full w-[50px] h-[50px] overflow-hidden mr-4 flex-shrink-0">
                    <Image src="/chad.png" alt="logo" width={60} height={60} />
                </span>
                <NavButton href="/">Home</NavButton>
                <NavButton href="/swap">Swap</NavButton>
                <NavButton disabled href="/liquidity">
                    Liquidity
                </NavButton>
                <NavButton disabled href="/vote">
                    Vote
                </NavButton>

                <div className="w-1 h-6 mx-2 rounded-md bg-card"></div>

                <NavButton disabled external href="">
                    Docs
                </NavButton>
            </div>

            <div className="ml-auto">
                <WalletMultiButton />
            </div>
        </div>
    );
};

export default NavBar;
