import { FC, PropsWithChildren } from "react";
import NavBar from "./NavBar";

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className="h-full relative mx-2">
            <NavBar />
            <main className="flex flex-col items-center">{children}</main>
        </div>
    );
};

export default DefaultLayout;
