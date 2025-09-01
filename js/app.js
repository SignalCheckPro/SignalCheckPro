import { getState, updateState, resetState } from './stateManager.js';
import * as UIManager from './uiManager.js';
import * as CalibrationEngine from './calibrationEngine.js';
import { generatePDF } from './pdfGenerator.js';

// --- INICIALIZACIÓN Y REGISTRO DE EVENTOS ---

/**
 * Función principal que se ejecuta cuando el DOM está listo.
 */
function main() {
    registerEventListeners();
    registerPWA();
    UIManager.resetUI(); // Asegura que la UI se reinicie al cargar la página
}

/**
 * Asigna todos los event listeners de la aplicación.
 */
function registerEventListeners() {
    UIManager.elements.instrumentForm.addEventListener('submit', handleInstrumentFormSubmit);
    UIManager.elements.validateBtn.addEventListener('click', handleValidation);
    UIManager.elements.backToDataBtn.addEventListener('click', () => UIManager.navigateToStep('step1'));
    UIManager.elements.generatePdfBtn.addEventListener('click', handlePdfGeneration);
    UIManager.elements.fullResetBtn.addEventListener('click', handleFullReset);
    
    // Validación en tiempo real para LRV y URV
    UIManager.elements.lrvInput.addEventListener('input', validateLrvUrv);
    UIManager.elements.urvInput.addEventListener('input', validateLrvUrv);
}

/**
 * Registra el Service Worker para la PWA.
 */
function registerPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => {
                    console.log('Service Worker registrado con éxito:', reg);
                })
                .catch(err => {
                    console.error('Fallo en el registro del Service Worker:', err);
                });
        });
    }
}

// --- MANEJADORES DE EVENTOS ---

/**
 * Maneja el envío del formulario del Paso 1.
 * @param {Event} event - El evento de envío del formulario.
 */
function handleInstrumentFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(UIManager.elements.instrumentForm);
    const instrumentData = Object.fromEntries(formData.entries());
    
    // Convertir LRV y URV a números y validar
    instrumentData.lrv = parseFloat(instrumentData.lrv);
    instrumentData.urv = parseFloat(instrumentData.urv);
    instrumentData.errorThreshold = parseFloat(instrumentData.errorThreshold);

    // Si la validación en tiempo real falló, no continuar
    if (!validateLrvUrv()) {
        return;
    }

    const idealPoints = CalibrationEngine.calculateCalibrationPoints(instrumentData.lrv, instrumentData.urv);

    updateState({ 
        instrumentData: instrumentData,
        calibrationData: { ideal: idealPoints, measured: [], errors: [] },
        errorThreshold: instrumentData.errorThreshold
    });

    UIManager.displayIdealValues(idealPoints, instrumentData.unit);
    UIManager.navigateToStep('step2');
}

/**
 * Maneja la validación y el cálculo de los datos de calibración.
 */
function handleValidation() {
    try {
        const state = getState();
        const measuredValues = Array.from(UIManager.elements.measuredInputs).map(input => parseFloat(input.value));
        const idealPoints = state.calibrationData.ideal;
        
        // Validación de entradas
        if (measuredValues.some(isNaN)) {
            UIManager.showError('Por favor, ingrese todos los valores medidos.');
            return;
        }

        const errors = CalibrationEngine.calculateErrors(idealPoints, measuredValues);
        const isApproved = CalibrationEngine.checkErrors(errors, state.errorThreshold);
        
        const equation = CalibrationEngine.calculateLinearEquation(state.instrumentData.lrv, state.instrumentData.urv);

        // Actualizar estado con los nuevos datos
        updateState({
            calibrationData: {
                ideal: idealPoints,
                measured: measuredValues,
                errors: errors
            },
            isApproved: isApproved,
            equation: equation
        });

        // Actualizar la UI
        UIManager.displayErrorValues(errors);
        UIManager.updateSummary(getState());
        UIManager.updateChart(getState());
        UIManager.navigateToStep('step3');

    } catch (error) {
        console.error("Error en la validación o cálculo:", error);
        UIManager.showError('Ocurrió un error inesperado al validar los datos.');
    }
}


/**
 * Maneja la generación del PDF.
 * Muestra un loader y genera el PDF de forma asíncrona.
 */
async function handlePdfGeneration() {
    UIManager.toggleLoader(UIManager.elements.generatePdfBtn, true);
    try {
        const state = getState();
        const chartInstance = UIManager.getChartInstance();
        generatePDF(state, chartInstance);
    } catch (error) {
        console.error("Error al generar el PDF:", error);
        UIManager.showError("Hubo un problema al generar el reporte PDF.");
    } finally {
        UIManager.toggleLoader(UIManager.elements.generatePdfBtn, false);
    }
}

/**
 * Reinicia la aplicación a su estado inicial.
 */
function handleFullReset() {
    resetState();
    UIManager.resetUI();
    UIManager.navigateToStep('step1');
}

// --- FUNCIONES DE VALIDACIÓN AUXILIARES ---

/**
 * Valida que LRV sea menor que URV en tiempo real.
 * @returns {boolean} - True si es válido, false si no.
 */
function validateLrvUrv() {
    const lrv = parseFloat(UIManager.elements.lrvInput.value);
    const urv = parseFloat(UIManager.elements.urvInput.value);
    
    if (!isNaN(lrv) && !isNaN(urv) && lrv >= urv) {
        UIManager.showError('El Valor Mínimo (LRV) debe ser menor que el Valor Máximo (URV).');
        UIManager.elements.lrvInput.classList.add('input-error');
        UIManager.elements.urvInput.classList.add('input-error');
        return false;
    }
    
    UIManager.hideError();
    UIManager.elements.lrvInput.classList.remove('input-error');
    UIManager.elements.urvInput.classList.remove('input-error');
    return true;
}

document.addEventListener('DOMContentLoaded', main);
