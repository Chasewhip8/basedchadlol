export function selectiveShallow<T>(
    objA: T,
    objB: T,
    excludeKeys: { [key: string]: true },
) {
    if (Object.is(objA, objB)) {
        return true;
    }
    if (
        typeof objA !== "object" ||
        objA === null ||
        typeof objB !== "object" ||
        objB === null
    ) {
        return false;
    }

    if (objA instanceof Map && objB instanceof Map) {
        if (objA.size !== objB.size) return false;

        for (const [key, value] of objA) {
            if (excludeKeys[key]) {
                continue;
            }
            if (!Object.is(value, objB.get(key))) {
                return false;
            }
        }
        return true;
    }

    if (objA instanceof Set && objB instanceof Set) {
        throw Error("utils::selectiveShallow::Set::SET_NOT_SUPPORTED");
    }

    const keysA = Object.keys(objA).filter((key) => !excludeKeys[key]);
    const keysB = Object.keys(objB).filter((key) => !excludeKeys[key]);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (const keyA of keysA) {
        if (
            !Object.prototype.hasOwnProperty.call(objB, keyA as string) ||
            !Object.is(objA[keyA as keyof T], objB[keyA as keyof T])
        ) {
            return false;
        }
    }
    return true;
}

export function selectiveArrayShallow<T>(
    arrA: T[],
    arrB: T[],
    excludeKeys: { [key: string]: true },
) {
    if (arrA.length !== arrB.length) {
        return false;
    }
    for (let i = 0; i < arrA.length; i++) {
        if (!selectiveShallow(arrA[i], arrB[i], excludeKeys)) {
            return false;
        }
    }
    return true;
}
