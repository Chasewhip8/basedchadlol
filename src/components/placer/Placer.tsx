import {FC, MouseEventHandler, useCallback, useEffect, useRef, useState} from "react";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import Dropzone from "react-dropzone";
import {CirclePlusIcon, SaveIcon, XIcon} from "lucide-react";
import {Slider} from "@/components/ui/slider";

export type Position = {
    x: number,
    y: number
}

function distance(a: Position, b: Position) {
    const ad = a.x - b.x;
    const bd = a.y - b.y;
    return Math.sqrt(ad * ad + bd * bd);
}

enum SelectionType {
    NONE,
    MOVE
}

interface Addon {
    image: HTMLImageElement,
    offsetX: number,
    offsetY: number,
    scale: number,
    selected?: SelectionType,
    selectedAt: Position,
    name: string
}

interface PlacerProps {

}

const Placer: FC<PlacerProps> = () => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const dragZone = useRef(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader();

            reader.onabort = () => {
                console.log('file reading was aborted');
            }
            reader.onerror = () => {
                // TODO
                console.log('file reading has failed');
            }
            reader.onload = () => {
                const image = new Image();

                image.onload = () => {
                    setImage(image);
                }
                image.onerror = () => {
                    // TODO
                    console.log('file reading has failed');
                }

                image.src = reader.result as string;
            }
            reader.readAsDataURL(file)
        })
    }, []);

    const [imageAddons, setImageAddons] = useState<Addon[]>([]);
    function addAddon(src: string, name: string) {
        const image = new Image();

        image.onload = () => {
            setImageAddons((prevState) => [...prevState, {
                scale: 0.5,
                image: image,
                offsetX: 0,
                offsetY: 0,
                selectedAt: { x: 0, y: 0 },
                name: name
            }])
        }
        image.onerror = () => {
            // TODO
            console.log('file reading has failed');
        }
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
            context.drawImage(
                addon.image,
                addon.offsetX, addon.offsetY,
                addon.image.width * addon.scale, addon.image.height * addon.scale
            );
        }
    }, [image, imageAddons]);

    const handleMoveSelection: MouseEventHandler = (e) => {
        if (!imageAddons || !canvas.current) {
            return;
        }

        const element = canvas.current;
        if (!element) {
            return;
        }

        const rect = element.getBoundingClientRect();

        const x = (e.clientX - rect.left) //  / rect.width * width;
        const y = (e.clientY - rect.top)  //  / rect.height * height;

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
    }

    return (
        <Card className="flex flex-col gap-4 p-6 mb-4">
            <h2 className="text-3xl font-semibold">Be Based, Create Memes</h2>

            {!image ?
                <Dropzone ref={dragZone} onDrop={onDrop}>
                    {({getRootProps, getInputProps}) => (
                        <Card className="border-dashed p-8 text-center cursor-pointer"  {...getRootProps()}>
                            <input {...getInputProps()} />
                            Drag or Click to upload image
                        </Card>
                    )}
                </Dropzone>
                :
                <>
                    <div className="flex flex-col gap-y-2">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="secondary" className="flex gap-x-2 bg-no-repeat bg-gradient-to-br from-solana-green to-solana-purple font-semibold"
                                onClick={() => addAddon("/chad.png", "Chad")}
                            >
                                <CirclePlusIcon/>
                                Based Chad
                            </Button>
                            <Button
                                variant="secondary" className="flex gap-x-2 bg-no-repeat bg-gradient-to-br from-solana-green to-solana-purple font-semibold"
                                onClick={() => addAddon("/chad_head.png", "Chad Head")}
                            >
                                <CirclePlusIcon/>
                                Based Chad Head
                            </Button>
                            <Button
                                className="flex gap-x-2"
                                onClick={() => addAddon("/vipers.png", "Vipers")}
                            >
                                <CirclePlusIcon/>
                                Vipers
                            </Button>
                            {/*<Button className="flex gap-x-2">*/}
                            {/*    <CirclePlusIcon/>*/}
                            {/*    Ticker*/}
                            {/*</Button>*/}

                            <Button
                                variant="destructive"
                                className="ml-auto"
                                onClick={() => {
                                    setImageAddons([]);
                                    setImage(null);
                                }}
                            >
                                Close Image
                            </Button>
                            <Button
                                variant="secondary" className="flex gap-x-2 bg-solana-green"
                                onClick={() => {
                                    if (!canvas.current) {
                                        return;
                                    }

                                    const link = document.createElement('a');
                                    link.download = 'meme.png';
                                    link.href = canvas.current.toDataURL()
                                    link.click();
                                }}
                            >
                                <SaveIcon/>
                                Download
                            </Button>
                        </div>

                        {imageAddons.map((addon, index) => (
                            <Card key={index} className="flex flex-row items-center p-2 px-4 justify-between">
                                <span className="font-semibold">{addon.name}</span>

                                <Slider
                                    max={1.5}
                                    min={0.001}
                                    step={0.0005}
                                    value={[addon.scale]}
                                    onValueChange={([newValue]) => {
                                        addon.scale = newValue;
                                        setImageAddons(() => [...imageAddons]);
                                    }}
                                    className="w-[60%]"
                                />

                                <Button
                                    size="icon"
                                    variant="destructive"
                                    onClick={() => setImageAddons((prevState) => prevState.filter((a) => a != addon))}
                                >
                                    <XIcon/>
                                </Button>
                            </Card>
                        ))}
                    </div>
                    <canvas
                        ref={canvas}
                        onMouseMove={(e) => {
                            if (e.buttons != 0) {
                                handleMoveSelection(e);
                            }
                        }}
                        onMouseDown={(e) => {
                            const element = canvas.current;
                            if (!element) {
                                return;
                            }

                            const rect = element.getBoundingClientRect();

                            const x = (e.clientX - rect.left) // / rect.width * width;
                            const y = (e.clientY - rect.top) // / rect.height * height;

                            const tolerance = 25;
                            let selected = false;
                            for (const box of imageAddons) {
                                box.selected = SelectionType.NONE;

                                const topPosition = { x: box.offsetX, y: box.offsetY };
                                const bottomPosition = { x: box.offsetX + (box.image.width * box.scale), y: box.offsetY + (box.image.height * box.scale) };

                                if (!selected &&
                                    x >= topPosition.x - tolerance && x <= bottomPosition.x + tolerance &&
                                    y >= topPosition.y - tolerance && y <= bottomPosition.y + tolerance) {

                                    box.selectedAt = {x: x, y: y};
                                    box.selected = SelectionType.MOVE;
                                    selected = true;
                                }
                            }
                        }}
                        onMouseUp={() => {
                            for (const addons of imageAddons) {
                                addons.selected = SelectionType.NONE;
                            }
                            setImageAddons(() => [...imageAddons]);
                        }}
                    />
                </>
            }
        </Card>
    )
}

export default Placer;