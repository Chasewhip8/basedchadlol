import { FC, PropsWithChildren } from "react";
import NavBar from "./NavBar";
import { ThemeProvider } from "./providers/ThemeProvider";
import SolanaProvider from "./providers/SolanaProvider";

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="h-full relative">
            <NavBar />
            <main className="flex flex-col items-center">{children}</main>
        </div>
    );
};

export default DefaultLayout;
