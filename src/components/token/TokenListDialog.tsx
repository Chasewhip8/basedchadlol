import { FC, PropsWithChildren } from "react";
import {
    DialogDescription,
    DialogHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { List } from "react-virtualized";

interface TokenListDialogProps {
    multiple?: boolean;
}

const TokenListDialog: FC<PropsWithChildren<TokenListDialogProps>> = ({
    children,
    multiple,
}) => {
    return (
        <Dialog>
            <DialogTrigger>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {multiple ? "Select Tokens" : "Select Token"}
                    </DialogTitle>
                    <DialogDescription>
                        {/* <List
                            width={300}
                            height={300}
                            rowCount={list.length}
                            rowHeight={20}
                            rowRenderer={rowRenderer}
                        /> */}
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};

export default TokenListDialog;
