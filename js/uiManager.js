// --- MÓDULO DE MANIPULACIÓN DEL DOM (UI) ---

let chartInstance = null;

// Centralizamos todos los selectores del DOM
export const elements = {
    steps: {
        step1: document.getElementById('step-1-datasheet'),
        step2: document.getElementById('step-2-calibration'),
        step3: document.getElementById('step-3-report')
    },
    instrumentForm: document.getElementById('instrumentForm'),
    validateBtn: document.getElementById('validateBtn'),
    backToDataBtn: document.getElementById('backToDataBtn'),
    generatePdfBtn: document.getElementById('generatePdfBtn'),
    fullResetBtn: document.getElementById('fullResetBtn'),
    errorMessageDiv: document.getElementById('error-message'),
    idealValuesCells: document.querySelectorAll('#ideal-values-row td:not(:first-child)'),
    measuredInputs: document.querySelectorAll('.measured-input'),
    errorValuesCells: document.querySelectorAll('#error-values-row td:not(:first-child)'),
    idealUnitSpan: document.getElementById('ideal-unit'),
    measuredUnitSpan: document.getElementById('measured-unit'),
    summary: {
        tag: document.getElementById('summary-tag'),
        date: document.getElementById('summary-date'),
        result: document.getElementById('summary-result'),
        equation: document.getElementById('summary-equation')
    },
    chartCanvas: document.getElementById('chart'),
    lrvInput: document.getElementById('lrv'),
    urvInput: document.getElementById('urv'),
};

/**
 * Navega a un paso específico de la aplicación.
 * @param {string} stepName - El nombre de la clave en `elements.steps`.
 */
export function navigateToStep(stepName) {
    Object.values(elements.steps).forEach(step => step.classList.remove('active'));
    elements.steps[stepName].classList.add('active');
    window.scrollTo(0, 0);
}

/**
 * Muestra un mensaje de error.
 * @param {string} message - El mensaje a mostrar.
 */
export function showError(message) {
    elements.errorMessageDiv.textContent = message;
    elements.errorMessageDiv.classList.remove('hidden');
}

/** Oculta el mensaje de error. */
export function hideError() {
    elements.errorMessageDiv.classList.add('hidden');
}

/**
 * Obtiene los datos del formulario del instrumento.
 * @returns {object} - Datos del instrumento.
 */
export function getInstrumentData() {
    return {
        tag: document.getElementById('tag').value,
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        power: document.getElementById('power').value,
        lrv: parseFloat(elements.lrvInput.value),
        urv: parseFloat(elements.urvInput.value),
        pvUnit: document.getElementById('pvUnit').value,
        tolerance: parseFloat(document.getElementById('tolerance').value),
        calibrator: document.getElementById('calibrator').value,
        technician: document.getElementById('technician').value
    };
}

/**
 * Obtiene los valores medidos de los inputs.
 * @returns {number[]} - Array de valores medidos.
 */
export function getMeasuredData() {
    return Array.from(elements.measuredInputs).map(input => parseFloat(input.value));
}

/**
 * Valida que todos los inputs de medición tengan un valor numérico.
 * @returns {boolean} - True si todos son válidos.
 */
export function validateMeasuredInputs() {
    return Array.from(elements.measuredInputs).every(input => input.value !== '' && !isNaN(parseFloat(input.value)));
}

/**
 * Renderiza los valores ideales en la tabla de calibración.
 * @param {number[]} idealPoints - Array de valores ideales.
 * @param {string} pvUnit - Unidad de la variable de proceso.
 */
export function renderCalibrationTable(idealPoints, pvUnit) {
    elements.idealValuesCells.forEach((cell, index) => {
        cell.textContent = parseFloat(idealPoints[index].toPrecision(6));
    });
    elements.idealUnitSpan.textContent = pvUnit;
    elements.measuredUnitSpan.textContent = pvUnit;
}

/**
 * Renderiza los errores calculados en la tabla.
 * @param {number[]} errors - Array de errores.
 * @param {number} errorThreshold - Umbral de tolerancia.
 */
export function renderErrors(errors, errorThreshold) {
    document.getElementById('error-values-row').classList.remove('hidden');
    elements.errorValuesCells.forEach((cell, index) => {
        const error = errors[index];
        cell.textContent = parseFloat(error.toPrecision(6));
        cell.classList.remove('error-ok', 'error-fail');
        cell.classList.add(Math.abs(error) <= errorThreshold ? 'error-ok' : 'error-fail');
    });
}

/**
 * Actualiza la vista del reporte final.
 * @param {object} summaryData - Datos para el resumen.
 */
export function updateReportView({ tag, isApproved, date, equation }) {
    elements.summary.tag.textContent = tag;
    elements.summary.date.textContent = date;
    const resultSpan = elements.summary.result;
    resultSpan.textContent = isApproved ? 'APROBADO (Dentro de Tolerancia)' : 'RECHAZADO (Fuera de Tolerancia)';
    resultSpan.className = isApproved ? 'error-ok' : 'error-fail';
    
    elements.summary.equation.textContent = equation;
    elements.summary.equation.classList.remove('hidden');
}

/**
 * Actualiza o crea el gráfico de resultados.
 * @param {object} instrumentData - Datos del instrumento (lrv, urv, pvUnit).
 */
export function updateChart({ lrv, urv, pvUnit }) {
    if (chartInstance) chartInstance.destroy();
    
    const ctx = elements.chartCanvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Comportamiento Ideal (4-20mA)',
                data: [{x: lrv, y: 4}, {x: urv, y: 20}],
                borderColor: '#2AFAFA',
                backgroundColor: '#2AFAFA',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: { type: 'linear', title: { display: true, text: `Valor de Proceso (${pvUnit})`, color: '#333' }, ticks: { color: '#333' } },
                y: { min: 0, max: 24, title: { display: true, text: 'Corriente (mA)', color: '#333' }, ticks: { color: '#333', stepSize: 4 } }
            },
            plugins: { legend: { labels: { color: '#333' } } }
        }
    });
}

/**
 * Devuelve la instancia actual del gráfico.
 * @returns {Chart} - La instancia del gráfico.
 */
export function getChartInstance() {
    return chartInstance;
}

/**
 * Muestra u oculta el spinner de carga en un botón.
 * @param {HTMLElement} button - El botón que contiene el loader.
 * @param {boolean} show - True para mostrar, false para ocultar.
 */
export function toggleLoader(button, show) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    if (show) {
        button.disabled = true;
        text.classList.add('hidden');
        spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        text.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

/**
 * Reinicia todos los elementos de la UI a su estado inicial.
 */
export function resetUI() {
    elements.instrumentForm.reset();
    elements.measuredInputs.forEach(input => input.value = '');
    elements.errorValuesCells.forEach(cell => { cell.textContent = '-'; cell.className = ''; });
    document.getElementById('error-values-row').classList.add('hidden');
    elements.idealValuesCells.forEach(cell => cell.textContent = '-');
    elements.idealUnitSpan.textContent = '';
    elements.measuredUnitSpan.textContent = '';
    elements.summary.tag.textContent = '';
    elements.summary.result.textContent = '';
    elements.summary.date.textContent = '';
    elements.summary.equation.classList.add('hidden');
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    hideError();
}
