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
    urvInput: document.getElementById('urv')
};

/**
 * Navega a un paso específico de la aplicación, ocultando los demás.
 * @param {string} stepId - El ID del paso al que se desea navegar (ej: 'step1').
 */
export function navigateToStep(stepId) {
    for (const step in elements.steps) {
        if (elements.steps[step]) {
            elements.steps[step].classList.remove('active');
        }
    }
    if (elements.steps[stepId]) {
        elements.steps[stepId].classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Muestra los valores ideales calculados en la tabla de calibración.
 * @param {number[]} values - Un array con los valores ideales.
 * @param {string} unit - La unidad de medida.
 */
export function displayIdealValues(values, unit) {
    elements.idealValuesCells.forEach((cell, index) => {
        cell.textContent = values[index].toFixed(2);
    });
    elements.idealUnitSpan.textContent = unit;
    elements.measuredUnitSpan.textContent = unit;
}

/**
 * Muestra los errores calculados en la tabla de calibración y los colorea.
 * @param {number[]} errors - Un array con los errores.
 */
export function displayErrorValues(errors) {
    document.getElementById('error-values-row').classList.remove('hidden');
    elements.errorValuesCells.forEach((cell, index) => {
        const error = errors[index];
        cell.textContent = error.toFixed(2);
        cell.className = '';
        if (Math.abs(error) > 0) {
            cell.classList.add('error-fail');
        } else {
            cell.classList.add('error-ok');
        }
    });
}

/**
 * Muestra un mensaje de error en la UI.
 * @param {string} message - El mensaje de error a mostrar.
 */
export function showError(message) {
    elements.errorMessageDiv.textContent = message;
    elements.errorMessageDiv.classList.remove('hidden');
}

/**
 * Oculta el mensaje de error de la UI.
 */
export function hideError() {
    elements.errorMessageDiv.textContent = '';
    elements.errorMessageDiv.classList.add('hidden');
}

/**
 * Actualiza la información de resumen en el paso 3.
 * @param {object} state - El estado de la aplicación.
 */
export function updateSummary(state) {
    const { tag, brand, model } = state.instrumentData;
    const { equation, isApproved } = state;

    elements.summary.tag.textContent = tag || '-';
    elements.summary.result.textContent = isApproved ? 'APROBADO' : 'RECHAZADO';
    elements.summary.result.classList.remove('error-ok', 'error-fail');
    elements.summary.result.classList.add(isApproved ? 'error-ok' : 'error-fail');
    elements.summary.date.textContent = new Date().toLocaleDateString();

    if (equation && equation.formatted) {
        elements.summary.equation.textContent = equation.formatted;
        elements.summary.equation.classList.remove('hidden');
    } else {
        elements.summary.equation.classList.add('hidden');
    }
}

/**
 * Actualiza o crea el gráfico de Chart.js.
 * @param {object} state - El estado de la aplicación.
 */
export function updateChart(state) {
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const ctx = elements.chartCanvas.getContext('2d');
    const { lrv, urv, unit } = state.instrumentData;
    const { ideal, measured } = state.calibrationData;

    const data = {
        labels: ideal.map(val => `${val.toFixed(2)} ${unit}`),
        datasets: [{
            label: 'Valores Ideales',
            data: ideal,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            pointBackgroundColor: 'rgb(75, 192, 192)',
            pointBorderColor: 'rgb(75, 192, 192)',
            fill: false,
            pointRadius: 6
        }, {
            label: 'Valores Medidos',
            data: measured,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            pointBackgroundColor: 'rgb(255, 99, 132)',
            pointBorderColor: 'rgb(255, 99, 132)',
            fill: false,
            pointRadius: 6
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Puntos de Calibración',
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: `Valores (${unit})`,
                        color: 'rgba(255, 255, 255, 0.8)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.9)'
                    }
                }
            }
        }
    };
    chartInstance = new Chart(ctx, config);
}

/**
 * Devuelve la instancia actual del gráfico.
 * @returns {Chart|null} La instancia de Chart.js o null si no existe.
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
    elements.lrvInput.classList.remove('input-error');
    elements.urvInput.classList.remove('input-error');
    hideError();
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}
