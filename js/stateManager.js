// --- GESTIÓN DEL ESTADO DE LA APLICACIÓN ---

// Estado inicial por defecto
const initialState = {
    instrumentData: {},
    calibrationData: {
        ideal: [],
        measured: [],
        errors: []
    },
    span: 0,
    errorThreshold: 0,
    isApproved: false,
    equation: { 
        m: 0, 
        b: 0, 
        formatted: '' 
    }
};

// Usamos structuredClone para asegurar que el estado sea una copia profunda
let appState = structuredClone(initialState);

/**
 * Devuelve una copia del estado actual para evitar mutaciones directas.
 * @returns {object} El estado actual de la aplicación.
 */
export function getState() {
    return { ...appState };
}

/**
 * Actualiza el estado de la aplicación fusionando el nuevo estado parcial.
 * @param {object} partialState - Un objeto con las claves del estado a actualizar.
 */
export function updateState(partialState) {
    appState = { ...appState, ...partialState };
}

/**
 * Restaura el estado de la aplicación a sus valores iniciales.
 */
export function resetState() {
    appState = structuredClone(initialState);
}
