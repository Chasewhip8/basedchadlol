import {
    FC,
    MouseEventHandler,
    TouchEventHandler,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Dropzone from "react-dropzone";
import { CirclePlusIcon, SaveIcon, XIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export type Position = {
    x: number;
    y: number;
};

enum SelectionType {
    NONE,
    MOVE,
}

interface Addon {
    image: HTMLImageElement;
    offsetX: number;
    offsetY: number;
    scale: number;
    rotation: number;
    selected?: SelectionType;
    selectedAt: Position;
    name: string;
}

interface PlacerProps {}

const Placer: FC<PlacerProps> = () => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const dragZone = useRef(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();

            reader.onabort = () => {
                console.log("file reading was aborted");
            };
            reader.onerror = () => {
                // TODO
                console.log("file reading has failed");
            };
            reader.onload = () => {
                const image = new Image();

                image.onload = () => {
                    setImage(image);
                };
                image.onerror = () => {
                    // TODO
                    console.log("file reading has failed");
                };

                image.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });
    }, []);

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const files = e.clipboardData?.files;
            if (!files) {
                return;
            }

            onDrop(Array.from(files));
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [onDrop]);

    const [imageAddons, setImageAddons] = useState<Addon[]>([]);
    function addAddon(src: string, name: string) {
        const image = new Image();

        image.onload = () => {
            setImageAddons((prevState) => [
                ...prevState,
                {
                    scale: 0.5,
                    image: image,
                    offsetX: 0,
                    offsetY: 0,
                    rotation: 0,
                    selectedAt: { x: 0, y: 0 },
                    name: name,
                },
            ]);
        };
        image.onerror = () => {
            // TODO
            console.log("file reading has failed");
        };
        image.src = src;
    }

    useEffect(() => {
        if (!image || !canvas.current) {
            return;
        }

        const context = canvas.current.getContext("2d");
        if (!context) {
            return;
        }

        context.canvas.width = image.width;
        context.canvas.height = image.height;
        context.drawImage(image, 0, 0);

        for (const addon of imageAddons) {
            // Assuming context is your canvas context and addon contains the necessary info
            // Save the current context state (important if this is part of a larger drawing function)
            context.save();

            // Move the origin of the canvas to the center of where the image will be drawn
            context.translate(
                addon.offsetX + (addon.image.width * addon.scale) / 2,
                addon.offsetY + (addon.image.height * addon.scale) / 2,
            );

            // Rotate the canvas around the new origin
            context.rotate(addon.rotation);

            // Draw the image centered on the new origin
            context.drawImage(
                addon.image,
                (-addon.image.width * addon.scale) / 2,
                (-addon.image.height * addon.scale) / 2,
                addon.image.width * addon.scale,
                addon.image.height * addon.scale,
            );

            // Restore the context to its original state
            context.restore();
        }
    }, [image, imageAddons]);

    const handleMoveSelection = useCallback(
        (clientX: number, clientY: number) => {
            if (!imageAddons || !canvas.current) {
                return;
            }

            const element = canvas.current;
            if (!element) {
                return;
            }

            const rect = element.getBoundingClientRect();

            const x = ((clientX - rect.left) / rect.width) * element.width;
            const y = ((clientY - rect.top) / rect.height) * element.height;

            for (const addons of imageAddons) {
                if (!addons.selected) {
                    continue;
                }

                switch (addons.selected) {
                    case SelectionType.MOVE:
                        addons.offsetX += x - addons.selectedAt.x;
                        addons.offsetY += y - addons.selectedAt.y;
                        break;
                }

                addons.selectedAt.x = x;
                addons.selectedAt.y = y;
            }

            setImageAddons(() => [...imageAddons]);
        },
        [imageAddons],
    );

    const handleStartSelection = (clientX: number, clientY: number) => {
        const element = canvas.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();

        const x = ((clientX - rect.left) / rect.width) * element.width;
        const y = ((clientY - rect.top) / rect.height) * element.height;

        const tolerance = 25;
        let selected = false;
        for (const box of imageAddons) {
            box.selected = SelectionType.NONE;

            const topPosition = { x: box.offsetX, y: box.offsetY };
            const bottomPosition = {
                x: box.offsetX + box.image.width * box.scale,
                y: box.offsetY + box.image.height * box.scale,
            };

            if (
                !selected &&
                x >= topPosition.x - tolerance &&
                x <= bottomPosition.x + tolerance &&
                y >= topPosition.y - tolerance &&
                y <= bottomPosition.y + tolerance
            ) {
                box.selectedAt = { x: x, y: y };
                box.selected = SelectionType.MOVE;
                selected = true;
            }
        }
    };

    const handleEndSelection = () => {
        for (const addons of imageAddons) {
            addons.selected = SelectionType.NONE;
        }
        setImageAddons(() => [...imageAddons]);
    };

    useEffect(() => {
        const element = canvas.current;
        if (!element) {
            return;
        }

        const mouseListener = (e: MouseEvent) => {
            handleMoveSelection(e.clientX, e.clientY);
            e.preventDefault();
        };
        element.addEventListener("mousemove", mouseListener, {
            passive: false,
        });

        const touchListener = (e: TouchEvent) => {
            handleMoveSelection(e.touches[0].clientX, e.touches[0].clientY);
            e.preventDefault();
        };
        element.addEventListener("touchmove", touchListener, {
            passive: false,
        });

        return () => {
            element.removeEventListener("mousemove", mouseListener);
            element.removeEventListener("touchmove", touchListener);
        };
    }, [handleMoveSelection]);

    return (
        <Card className="flex flex-col gap-4 p-6 mb-4">
            <h2 className="text-3xl font-semibold">Be Based, Create Memes</h2>

            {!image ? (
                <Dropzone ref={dragZone} onDrop={onDrop}>
                    {({ getRootProps, getInputProps }) => (
                        <Card
                            className="border-dashed p-8 text-center cursor-pointer"
                            {...getRootProps()}
                        >
                            <input {...getInputProps()} />
                            Drag or Click to upload image
                        </Card>
                    )}
                </Dropzone>
            ) : (
                <>
                    <div className="flex flex-col gap-y-2">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                className="flex gap-x-2"
                                onClick={() =>
                                    addAddon("/vipers.png", "Vipers")
                                }
                            >
                                <CirclePlusIcon />
                                Vipers
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex gap-x-2"
                                onClick={() => addAddon("/chad.png", "Chad")}
                            >
                                <CirclePlusIcon />
                                Based Chad
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex gap-x-2 mr-auto"
                                onClick={() =>
                                    addAddon("/chad_head.png", "Chad Head")
                                }
                            >
                                <CirclePlusIcon />
                                Based Chad Head
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setImageAddons([]);
                                        setImage(null);
                                    }}
                                >
                                    Close Image
                                </Button>
                                <Button
                                    variant="constructive"
                                    className="flex gap-x-2"
                                    onClick={() => {
                                        if (!canvas.current) {
                                            return;
                                        }

                                        const link =
                                            document.createElement("a");
                                        link.download = "meme.png";
                                        link.href = canvas.current.toDataURL();
                                        link.click();
                                    }}
                                >
                                    <SaveIcon />
                                    Download
                                </Button>
                            </div>
                        </div>

                        {imageAddons.map((addon, index) => (
                            <Card
                                key={index}
                                className="flex sm:flex-row flex-col items-center gap-x-8 gap-y-4 p-4 justify-between"
                            >
                                <div className="font-bold w-full max-w-[15%]">
                                    {addon.name}
                                </div>

                                <div className="flex flex-wrap w-full gap-4">
                                    <Label className="w-full gap-y-2 flex flex-col">
                                        Scale
                                        <Slider
                                            max={3}
                                            min={0.001}
                                            step={0.0005}
                                            value={[addon.scale]}
                                            onValueChange={([newValue]) => {
                                                addon.scale = newValue;
                                                setImageAddons(() => [
                                                    ...imageAddons,
                                                ]);
                                            }}
                                        />
                                    </Label>

                                    <Label className="w-full gap-y-2 flex flex-col">
                                        Rotation
                                        <Slider
                                            max={6.28}
                                            min={-6.28}
                                            step={0.0005}
                                            value={[addon.rotation]}
                                            onValueChange={([newValue]) => {
                                                addon.rotation = newValue;
                                                setImageAddons(() => [
                                                    ...imageAddons,
                                                ]);
                                            }}
                                        />
                                    </Label>
                                </div>

                                <Button
                                    className="px-2"
                                    size="icon"
                                    variant="destructive"
                                    onClick={() =>
                                        setImageAddons((prevState) =>
                                            prevState.filter((a) => a != addon),
                                        )
                                    }
                                >
                                    <XIcon />
                                </Button>
                            </Card>
                        ))}
                    </div>
                    <canvas
                        className="max-w-full"
                        ref={canvas}
                        onMouseDown={(e) =>
                            handleStartSelection(e.clientX, e.clientY)
                        }
                        onTouchStart={(e) =>
                            handleStartSelection(
                                e.touches[0].clientX,
                                e.touches[0].clientY,
                            )
                        }
                        onMouseUp={handleEndSelection}
                        onTouchEnd={handleEndSelection}
                    />
                </>
            )}
        </Card>
    );
};

export default Placer;
