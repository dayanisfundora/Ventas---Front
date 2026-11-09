/**
 * Feature switches. A disabled feature is hidden from the menu, its routes redirect
 * to Inicio and its sections inside other pages are not rendered; code and data stay intact.
 */
export const FEATURES = {
    finance: false,
}

export function featureEnabled(key) {
    return !key || FEATURES[key] !== false
}
