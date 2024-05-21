import { FC } from "react";
import NavButton from "./NavButton";
import Image from "next/image";

const NavBar: FC = () => {
    return (
        <div className="flex flex-row gap-x-2 items-center w-full py-4 px-6 overflow-x-auto">
            <span className="rounded-full w-[50px] h-[50px] overflow-hidden mr-4 flex-shrink-0">
                <Image src="/chad.png" alt="logo" width={60} height={60} />
            </span>
            <NavButton href="/">Home</NavButton>
            <NavButton href="/swap">Swap</NavButton>
            <NavButton disabled href="/liquidity">Liquidity</NavButton>
            <NavButton disabled href="/vote">Vote</NavButton>
        </div>
    );
};

export default NavBar;
