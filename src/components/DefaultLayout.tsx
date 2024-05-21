import { FC, PropsWithChildren } from "react";
import NavBar from "./NavBar";
import { ThemeProvider } from "./providers/ThemeProvider";

const DefaultLayout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
        >
            <NavBar/>
            <main className="flex flex-col items-center">
                {children}
            </main>
        </ThemeProvider>
    )
}

export default DefaultLayout;
