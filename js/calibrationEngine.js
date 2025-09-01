// --- MOTOR DE CÁLCULOS DE CALIBRACIÓN (Funciones Puras) ---

/**
 * Calcula los 5 puntos de calibración ideales.
 * @param {number} lrv - Valor Mínimo del Rango.
 * @param {number} urv - Valor Máximo del Rango.
 * @returns {number[]} Un array con los 5 valores ideales.
 */
export function calculateCalibrationPoints(lrv, urv) {
    const span = urv - lrv;
    const increment = span / 4;
    return [
        lrv,
        lrv + increment,
        lrv + (2 * increment),
        lrv + (3 * increment),
        urv
    ];
}

/**
 * Calcula la ecuación lineal de la curva 4-20mA.
 * y = mx + b  =>  mA = m * PV + b
 * @param {number} lrv - Valor Mínimo del Rango (PV).
 * @param {number} urv - Valor Máximo del Rango (PV).
 * @returns {object} Objeto con la pendiente (m), intercepto (b) y la ecuación formateada.
 */
export function calculateLinearEquation(lrv, urv) {
    const span = urv - lrv;
    if (span === 0) return { m: 0, b: 4, formatted: 'Rango inválido' };

    const m = 16 / span; // Pendiente (16mA / span de PV)
    const b = 4 - (m * lrv); // Intercepto (calculado en el punto LRV donde mA=4)
    
    const sign = b >= 0 ? '+' : '-';
    const formatted = `Corriente (mA) = ${m.toFixed(5)} * PV ${sign} ${Math.abs(b).toFixed(5)}`;
    
    return { m, b, formatted };
}

/**
 * Calcula la diferencia (error) entre los valores ideales y los medidos.
 * @param {number[]} idealPoints - Array de valores ideales.
 * @param {number[]} measuredPoints - Array de valores medidos.
 * @returns {number[]} Un array con los errores calculados.
 */
export function calculateErrors(idealPoints, measuredPoints) {
    return idealPoints.map((ideal, index) => ideal - measuredPoints[index]);
}

/**
 * Verifica si todos los errores están dentro del umbral de tolerancia.
 * @param {number[]} errors - Array de errores calculados.
 * @param {number} errorThreshold - El umbral de error permitido.
 * @returns {boolean} True si todos los errores están dentro del umbral, false si no.
 */
export function checkErrors(errors, errorThreshold) {
    return errors.every(error => Math.abs(error) <= errorThreshold);
}
