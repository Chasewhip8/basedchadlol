import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function objectKeyCount(obj: Object) {
    let count = 0;
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            count++;
        }
    }
    return count;
}
