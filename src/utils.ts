export const deepCopy = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
}

export const deepMerge = (target: any, source: any): any => {
    for (const key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}