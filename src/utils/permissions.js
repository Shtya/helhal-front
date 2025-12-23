

export function bitmaskToArray(mask, actions) {
    if (!mask || !actions) return [];

    return actions
        .filter(action => typeof action.value === 'number' && (mask & action.value) === action.value)
        .map(action => action.value);
}


export function arrayToBitmask(values) {
    return values.reduce((acc, v) => acc | v, 0);
}



/**
 * Checks if a bitmask contains a permission
 */
export function has(mask, permission) {
    return (mask & permission) === permission;
}

/**
 * Adds a permission to a mask
 */
export function add(mask, permission) {
    return mask | permission;
}

/**
 * Removes a permission from a mask
 */
export function remove(mask, permission) {
    return mask & ~permission;
}