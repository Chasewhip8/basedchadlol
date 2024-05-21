import DefaultLayout from "@/components/DefaultLayout";
import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";

const Swap: NextPageWithLayout = () => {
    return (
        <>


        </>
    );
};

Swap.getLayout = function getLayout(page: ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>;
}

export default Swap;
