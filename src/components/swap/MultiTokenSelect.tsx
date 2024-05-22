import { FC } from "react";
import {
    DialogDescription,
    DialogHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

const MultiTokenSelect: FC = () => {
    return (
        <Dialog>
            <DialogTrigger>
                <Button variant="secondary">Test</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};

export default MultiTokenSelect;
